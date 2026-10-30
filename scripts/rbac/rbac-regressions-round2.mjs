// Regresiones de la segunda ronda (verificador de caja blanca).
export async function regressionsRound2({
  as,
  db,
  check,
  code,
  short,
  ids,
  userId,
}) {
  const A = (u, name, args) => as(u).then((s) => s.action(name, args));
  const BASE = "http://localhost:3000";
  let r;
  let res;

  const owner1 = await as("owner1");
  const coadmin = await as("owner");
  const admin = await as("admin");
  const vend = await as("vendedor");
  const userAccountId = await userId("user");

  // V-1: reinvitar no puede cancelar/extender invitaciones de rol superior
  r = await owner1.auth("POST", "/organization/invite-member", {
    body: {
      organizationId: ids.playas,
      email: "g.rbac-suite@yopmail.com",
      role: "admin",
    },
  });
  const adminInvitation = r.body?.id;
  r = await coadmin.auth("POST", "/organization/invite-member", {
    body: {
      organizationId: ids.playas,
      email: "g.rbac-suite@yopmail.com",
      role: "member",
    },
  });
  check(
    "regresión",
    "co-admin no anula invitación de co-admin reinvitando",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  r = await coadmin.auth("POST", "/organization/invite-member", {
    body: {
      organizationId: ids.playas,
      email: "g.rbac-suite@yopmail.com",
      role: "member",
      resend: true,
    },
  });
  check(
    "regresión",
    "co-admin no extiende invitación de co-admin (resend)",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  const stillPending = adminInvitation
    ? (
        await db(`select status from invitation where id=$1`, [adminInvitation])
      )[0]?.status
    : null;
  check(
    "regresión",
    "la invitación de co-admin sigue pendiente",
    stillPending === "pending",
    stillPending,
  );

  // V-1b: cambiar rol / quitar miembro por better-auth directo, bloqueado para todos
  for (const [path, body] of [
    [
      "/organization/update-member-role",
      {
        organizationId: ids.playas,
        memberId: ids.miembroMember,
        role: "seller",
      },
    ],
    [
      "/organization/remove-member",
      { organizationId: ids.playas, memberIdOrEmail: ids.miembroMember },
    ],
  ]) {
    r = await owner1.auth("POST", path, { body });
    check(
      "regresión",
      `${path} directo bloqueado (incluso para el owner)`,
      r.status === 403,
      `${r.status}`,
    );
  }

  // V-4: /admin/update-user solo con los campos del panel
  r = await admin.auth("POST", "/admin/update-user", {
    body: { userId: userAccountId, data: { emailVerified: false } },
  });
  check(
    "regresión",
    "update-user con campos no editables → 400",
    r.status === 400,
    `${r.status}`,
  );
  const verified = (
    await db(`select email_verified from "user" where username='user'`)
  )[0].email_verified;
  check(
    "regresión",
    "emailVerified de user intacto",
    verified === true,
    verified,
  );

  // V-4b: no se elimina la cuenta del único owner de una comuna (fixture propio)
  const stamp = Date.now();
  const tmpUser = `rbacsuite${stamp}`;
  const tmpOrg = `rbacsuite-org-${stamp}`;
  await db(
    `insert into "user" (id, name, email, email_verified, created_at, updated_at, username, display_username, role, banned)
     values ($1, 'RBAC suite tmp', $2, true, now(), now(), $1, $1, 'user', false)`,
    [tmpUser, `${tmpUser}@yopmail.com`],
  );
  await db(
    `insert into organization (id, name, slug, created_at) values ($1, $1, $1, now())`,
    [tmpOrg],
  );
  await db(
    `insert into member (id, organization_id, user_id, role, created_at) values ($1, $2, $3, 'owner', now())`,
    [`rbacsuite-m1-${stamp}`, tmpOrg, tmpUser],
  );
  try {
    r = await admin.auth("POST", "/admin/remove-user", {
      body: { userId: tmpUser },
    });
    const tmpStill = (
      await db(`select count(*)::int n from "user" where id=$1`, [tmpUser])
    )[0].n;
    check(
      "regresión",
      "no se elimina la cuenta del único owner de una comuna",
      r.status === 400 && tmpStill === 1,
      `${r.status} exists=${tmpStill}`,
    );

    // V-3: degradaciones simultáneas no dejan la comuna sin owner
    const second = `rbacsuite-m2-${stamp}`;
    await db(
      `insert into member (id, organization_id, user_id, role, created_at)
       values ($1, $2, (select id from "user" where username='owner1'), 'owner', now())`,
      [second, tmpOrg],
    );
    const results = await Promise.all([
      A("admin", "updateMemberRole", [
        {
          organizationId: tmpOrg,
          memberId: `rbacsuite-m1-${stamp}`,
          role: "member",
        },
      ]),
      A("admin", "updateMemberRole", [
        { organizationId: tmpOrg, memberId: second, role: "member" },
      ]),
    ]);
    const owners = (
      await db(
        `select count(*)::int n from member where organization_id=$1 and role='owner'`,
        [tmpOrg],
      )
    )[0].n;
    check(
      "regresión",
      "degradaciones simultáneas: la comuna conserva un owner",
      owners === 1 && results.some((x) => code(x) === "CONFLICT"),
      `owners=${owners} ${results.map(code).join(",")}`,
    );
  } finally {
    await db(`delete from organization where id=$1`, [tmpOrg]);
    await db(`delete from "user" where id=$1`, [tmpUser]);
  }

  // V-4c: un vendedor no retira por su cuenta un ítem con ventas
  const [sold] = await db(
    `select p.id, p.status from product p join product_line pl on pl.product_id = p.id
     where p.seller_id = (select id from "user" where username='vendedor') and p.deleted = false limit 1`,
  );
  if (sold) {
    await db(`update product set status='pending' where id=$1`, [sold.id]);
    try {
      r = await A("vendedor", "deleteProduct", [sold.id]);
      const after = (
        await db(`select deleted from product where id=$1`, [sold.id])
      )[0].deleted;
      check(
        "regresión",
        "vendedor no elimina un ítem con ventas aunque esté pendiente",
        code(r) === "FORBIDDEN" && after === false,
        `${short(r.result)} deleted=${after}`,
      );
    } finally {
      await db(`update product set status=$2, deleted=false where id=$1`, [
        sold.id,
        sold.status,
      ]);
    }
  }

  // V-2: editar no borra del almacenamiento imágenes que otro ítem usa
  const png = Uint8Array.from(
    atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    ),
    (c) => c.charCodeAt(0),
  );
  const upload = new FormData();
  upload.append(
    "file",
    new Blob([png], { type: "image/png" }),
    "rbac-suite.png",
  );
  upload.append("folder", "products");
  res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    headers: { cookie: vend.cookie, origin: BASE },
    body: upload,
  });
  const imageUrl = (await res.json().catch(() => ({}))).url;
  check(
    "regresión",
    "vendedor sube una imagen PNG válida",
    res.status === 200 && !!imageUrl,
    res.status,
  );
  if (imageUrl) {
    const base = {
      description: "x",
      price: "10.00",
      stock: 1,
      isReservable: false,
      sellerId: "x",
    };
    const own = await A("vendedor", "createProduct", [
      {
        ...base,
        name: "RBAC-SUITE img dueño",
        organizationId: ids.playas,
        images: [imageUrl],
      },
    ]);
    const other = await A("vendedor2", "createProduct", [
      {
        ...base,
        name: "RBAC-SUITE img copia",
        organizationId: ids.libertad,
        images: [imageUrl],
      },
    ]);
    const otherId = other.result?.data?.id;
    const ownId = own.result?.data?.id;
    if (otherId) {
      await A("vendedor2", "updateProduct", [
        otherId,
        {
          name: "RBAC-SUITE img copia",
          price: "10.00",
          stock: 1,
          organizationId: ids.libertad,
          images: [],
        },
      ]);
      const head = await fetch(imageUrl, { method: "HEAD" });
      check(
        "regresión",
        "quitar una imagen ajena de tu ítem no la borra del almacenamiento",
        head.status === 200,
        head.status,
      );
      await db(`delete from product where id=$1`, [otherId]);
    }
    if (ownId) {
      // limpieza: el dueño la quita y ya nadie la referencia → se borra de R2
      await A("vendedor", "updateProduct", [
        ownId,
        {
          name: "RBAC-SUITE img dueño",
          price: "10.00",
          stock: 1,
          organizationId: ids.playas,
          images: [],
        },
      ]);
    }
  }
}
