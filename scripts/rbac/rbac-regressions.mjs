// Regresiones de los hallazgos de los agentes validadores (se ejecuta desde rbac-suite.mjs).
export async function regressions({ as, db, check, code, short, ids, userId }) {
  const A = (u, name, args) => as(u).then((s) => s.action(name, args));
  const BASE = "http://localhost:3000";
  let r;
  let res;

  // H-1: id + slug de comunas distintas (guarda vs better-auth)
  await db(
    `insert into member (id, organization_id, user_id, role, created_at)
     values ($1, $2, (select id from "user" where username='vendedor'), 'admin', now())`,
    [`rbacsuite-${Date.now()}`, ids.prueba],
  );
  const vend = await as("vendedor");
  r = await vend.auth("GET", "/organization/get-full-organization", {
    query: { organizationId: ids.prueba, organizationSlug: "playas" },
  });
  check(
    "regresión",
    "id de comuna propia + slug ajeno en get-full-organization → denegado",
    r.status === 400 || r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  r = await vend.auth("GET", "/organization/list-members", {
    query: { organizationId: ids.prueba, organizationSlug: "playas" },
  });
  check(
    "regresión",
    "id propio + slug ajeno en list-members → denegado",
    r.status === 400 || r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  await vend.auth("POST", "/organization/set-active", {
    body: { organizationId: ids.playas },
  });
  r = await vend.auth("GET", "/organization/list-invitations", {
    query: { organizationSlug: "prueba" },
  });
  check(
    "regresión",
    "list-invitations con slug + comuna activa ajena → denegado",
    r.status === 400 || r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  r = await vend.auth("GET", "/organization/list-invitations", {
    query: { organizationId: ids.prueba },
  });
  check(
    "regresión",
    "list-invitations de su comuna administrada → permitido",
    r.status === 200,
    `${r.status} ${short(r.body)}`,
  );

  // H-2: roles compuestos
  const owner1 = await as("owner1");
  r = await owner1.auth("POST", "/organization/update-member-role", {
    body: {
      organizationId: ids.playas,
      memberId: ids.owner1Member,
      role: ["owner", "member"],
    },
  });
  check(
    "regresión",
    "rol compuesto owner,member rechazado",
    r.status === 400 || r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  r = await owner1.auth("POST", "/organization/invite-member", {
    body: {
      organizationId: ids.playas,
      email: "e.rbac-suite@yopmail.com",
      role: "seller,admin",
    },
  });
  check(
    "regresión",
    "invitar con rol compuesto rechazado",
    r.status === 400,
    `${r.status} ${short(r.body)}`,
  );

  // H-3: co-admin no cancela invitaciones de nivel admin/owner
  r = await owner1.auth("POST", "/organization/invite-member", {
    body: {
      organizationId: ids.playas,
      email: "f.rbac-suite@yopmail.com",
      role: "admin",
    },
  });
  const invitationId = r.body?.id;
  check(
    "regresión",
    "owner invita como co-admin",
    r.status === 200 && !!invitationId,
    `${r.status} ${short(r.body)}`,
  );
  if (invitationId) {
    r = await (
      await as("owner")
    ).auth("POST", "/organization/cancel-invitation", {
      body: { invitationId },
    });
    check(
      "regresión",
      "co-admin no cancela invitación de co-admin",
      r.status === 403,
      `${r.status} ${short(r.body)}`,
    );
    r = await owner1.auth("POST", "/organization/cancel-invitation", {
      body: { invitationId },
    });
    check(
      "regresión",
      "owner cancela la invitación",
      r.status === 200,
      `${r.status} ${short(r.body)}`,
    );
  }

  // H-4: /organization/update directo bloqueado
  r = await owner1.auth("POST", "/organization/update", {
    body: { organizationId: ids.playas, data: { metadata: { x: 1 } } },
  });
  check(
    "regresión",
    "/organization/update directo bloqueado",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );

  // H-5: agenda de servicio no aprobado
  r = await A("guest", "getOccupiedDaysByMonthAction", [
    { serviceId: ids["owner-svc-pending"], year: 2026, month: 12 },
  ]);
  check(
    "regresión",
    "agenda de servicio pendiente no se expone",
    Array.isArray(r.result?.data)
      ? r.result.data.length === 0
      : !!r.result?.error,
    short(r.result),
  );

  // H-6: /api/upload solo vendedores y con firma real
  const form = (bytes, type) => {
    const f = new FormData();
    f.append("file", new Blob([bytes], { type }), "x.png");
    f.append("folder", "products");
    return f;
  };
  const user = await as("user");
  res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    headers: { cookie: user.cookie, origin: BASE },
    body: form(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/png",
    ),
  });
  check(
    "regresión",
    "cliente no sube imágenes (403)",
    res.status === 403,
    res.status,
  );
  res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    headers: { cookie: vend.cookie, origin: BASE },
    body: form(
      new TextEncoder().encode("<html>no soy png</html>"),
      "image/png",
    ),
  });
  check(
    "regresión",
    "archivo con firma falsa rechazado (400)",
    res.status === 400,
    res.status,
  );

  // H-7: columnas internas ocultas en ficha pública (owner-pending fue aprobado en la suite)
  r = await A("guest", "getProductById", [ids["owner-pending"]]);
  check(
    "regresión",
    "ficha pública sin approvedBy/rejectionReason",
    r.result?.data
      ? r.result.data.approvedBy === null &&
          r.result.data.rejectionReason === null
      : false,
    short(r.result),
  );

  // H-8: carrera al moderar
  await db(`update product set status='pending' where id=$1`, [
    ids["v2-pending"],
  ]);
  r = await A("owner2", "approveItem", [
    {
      itemId: ids["v2-pending"],
      itemType: "product",
      expectedUpdatedAt: "2000-01-01T00:00:00.000Z",
    },
  ]);
  check(
    "regresión",
    "aprobar versión desactualizada → CONFLICT",
    code(r) === "CONFLICT",
    short(r.result),
  );

  // F1 + lista blanca del plugin admin
  const admin = await as("admin");
  const userAccountId = await userId("user");
  r = await admin.auth("POST", "/admin/set-role", {
    body: { userId: userAccountId, role: "owner" },
  });
  check(
    "regresión",
    "set-role con rol global inválido → 400",
    r.status === 400,
    `${r.status}`,
  );
  r = await admin.auth("POST", "/admin/update-user", {
    body: { userId: userAccountId, data: { role: "seller" } },
  });
  check(
    "regresión",
    "update-user con rol global inválido → 400",
    r.status === 400,
    `${r.status}`,
  );
  r = await admin.auth("POST", "/admin/impersonate-user", {
    body: { userId: userAccountId },
  });
  check(
    "regresión",
    "suplantación de usuarios deshabilitada",
    r.status === 403,
    `${r.status}`,
  );
  r = await admin.auth("POST", "/admin/set-user-password", {
    body: { userId: userAccountId, newPassword: "Xx123456789!" },
  });
  check(
    "regresión",
    "cambio de contraseña ajena deshabilitado",
    r.status === 403,
    `${r.status}`,
  );
  const roleNow = (await db(`select role from "user" where username='user'`))[0]
    .role;
  check(
    "regresión",
    "rol de user intacto tras intentos",
    roleNow === "user",
    roleNow,
  );

  // Reservas y compras
  r = await A("user", "simulatePurchase", [
    [
      {
        type: "product",
        product: { id: ids["vend-approved"] },
        quantity: 1,
        reservationDate: "2000-01-01",
      },
    ],
  ]);
  check(
    "regresión",
    "reservar producto en fecha pasada → INVALID_DATES",
    code(r) === "INVALID_DATES",
    short(r.result),
  );
  const past = await db(
    `select bl.transaction_line_id id from booking_line bl
     join transaction_line tl on tl.id = bl.transaction_line_id
     where bl.user_id = (select id from "user" where username='user')
       and tl.status <> 'cancelled' and bl.end_date < now() - interval '2 days' limit 1`,
  );
  if (past[0]) {
    r = await A("user", "cancelBooking", [past[0].id]);
    const st = (
      await db(`select status from transaction_line where id=$1`, [past[0].id])
    )[0].status;
    check(
      "regresión",
      "no se cancela una reserva pasada",
      code(r) === "CANNOT_CANCEL" && st !== "cancelled",
      `${short(r.result)} status=${st}`,
    );
  }

  // Perfil con cookie inválida
  res = await fetch(`${BASE}/owner1`, {
    redirect: "manual",
    headers: { cookie: "manglara.session_token=AAAA.fake" },
  });
  check(
    "regresión",
    "/[username] con cookie inválida → sign-in (no 500)",
    res.status >= 300 && res.status < 400,
    res.status,
  );
}
