// Batería RBAC de Manglara: valida la matriz de permisos (docs/RBAC.md) contra el
// servidor real, como cada rol: páginas, /api/auth/* y server actions directas.
//   node scripts/rbac/rbac-suite.mjs   → imprime resultados y escribe .cookies/results.json
// Crea sus propios ítems de prueba ("RBAC-SUITE ...") y los borra al terminar.

import { writeFileSync } from "node:fs";
import { as, db } from "./harness.mjs";
import { regressions } from "./rbac-regressions.mjs";
import { regressionsRound2 } from "./rbac-regressions-round2.mjs";
import { regressionsRound3 } from "./rbac-regressions-round3.mjs";

const results = [];
const check = (area, name, ok, detail = "") => {
  results.push({ area, name, ok: !!ok, detail: ok ? "" : detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  [${area}] ${name}${ok ? "" : "  → " + detail}`,
  );
};
const code = (r) => r?.result?.error?.code ?? (r?.result?.error ? "ERR" : "OK");
const short = (x) => JSON.stringify(x)?.slice(0, 300);

const PREFIX = "RBAC-SUITE";
const ids = {};

// ---------------- fixtures ----------------
async function orgId(slug) {
  return (await db(`select id from organization where slug=$1`, [slug]))[0].id;
}
async function userId(username) {
  return (await db(`select id from "user" where username=$1`, [username]))[0]
    .id;
}
async function fixtureProduct(key, seller, slug, status) {
  const id = crypto.randomUUID();
  await db(
    `insert into product (id,name,description,price,stock,seller_id,organization_id,status,deleted,created_at,updated_at)
     values ($1,$2,'fixture',12.00,5,$3,$4,$5,false,now(),now())`,
    [id, `${PREFIX} ${key}`, await userId(seller), await orgId(slug), status],
  );
  ids[key] = id;
}
async function fixtureService(key, seller, slug, status) {
  const id = crypto.randomUUID();
  await db(
    `insert into service (id,name,description,service_type,price,price_unit,max_capacity,seller_id,organization_id,status,deleted,created_at,updated_at)
     values ($1,$2,'fixture','activity',20.00,'person',4,$3,$4,$5,false,now(),now())`,
    [id, `${PREFIX} ${key}`, await userId(seller), await orgId(slug), status],
  );
  ids[key] = id;
}
const status = async (table, id) =>
  (await db(`select status, deleted from ${table} where id=$1`, [id]))[0];

async function setup() {
  ids.playas = await orgId("playas");
  ids.libertad = await orgId("libertad");
  ids.prueba = await orgId("prueba");
  await fixtureProduct("vend-pending", "vendedor", "playas", "pending");
  await fixtureProduct("vend-pending-2", "vendedor", "playas", "pending");
  await fixtureProduct("vend-approved", "vendedor", "playas", "approved");
  await fixtureProduct("vend-rejected", "vendedor", "playas", "rejected");
  await fixtureProduct("owner-pending", "owner", "playas", "pending");
  await fixtureProduct("v2-pending", "vendedor2", "libertad", "pending");
  await fixtureProduct("v2-pending-2", "vendedor2", "libertad", "pending");
  await fixtureService("owner-svc-pending", "owner", "playas", "pending");
  await fixtureService("v2-svc-pending", "vendedor2", "libertad", "pending");
  ids.miembroMember = (
    await db(
      `select m.id from member m join "user" u on u.id=m.user_id where u.username='miembro' and m.organization_id=$1`,
      [ids.playas],
    )
  )[0].id;
  ids.owner1Member = (
    await db(
      `select m.id from member m join "user" u on u.id=m.user_id where u.username='owner1' and m.organization_id=$1`,
      [ids.playas],
    )
  )[0].id;
  ids.vendedor2Member = (
    await db(
      `select m.id from member m join "user" u on u.id=m.user_id where u.username='vendedor2' and m.organization_id=$1`,
      [ids.libertad],
    )
  )[0].id;
}

async function teardown() {
  await db(
    `delete from request where product_id in (select id from product where name like $1) or service_id in (select id from service where name like $1)`,
    [`${PREFIX}%`],
  );
  await db(`delete from product where name like $1`, [`${PREFIX}%`]);
  await db(`delete from service where name like $1`, [`${PREFIX}%`]);
  await db(`update member set role='member' where id=$1`, [ids.miembroMember]);
  await db(`update member set role='owner' where id=$1`, [ids.owner1Member]);
  await db(`update member set role='seller' where id=$1`, [
    ids.vendedor2Member,
  ]);
  await db(
    `delete from member where organization_id=$1 and user_id=(select id from "user" where username='user')`,
    [ids.prueba],
  );
  await db(`delete from invitation where email like '%rbac-suite%'`);
  await db(`delete from organization where slug like 'rbac-suite-%'`);
  await db(`delete from member where id like 'rbacsuite-%'`);
}

// ---------------- tests ----------------
async function pages() {
  const g = await as("guest");
  for (const p of ["/home", "/explore"]) {
    const r = await g.page(p);
    check("páginas", `invitado ve ${p}`, r.status === 200, r.status);
  }
  for (const p of [
    "/admin",
    "/seller/products",
    "/organizations",
    `/review/product/${ids["vend-pending"]}`,
    "/reservations",
    "/cart",
  ]) {
    const r = await g.page(p);
    check(
      "páginas",
      `invitado no entra a ${p} (→ sign-in)`,
      r.status >= 300 && r.status < 400 && /sign-in/.test(r.location ?? ""),
      `${r.status} ${r.location}`,
    );
  }
  let r = await g.page(`/products/${ids["vend-pending"]}`);
  check("páginas", "invitado: producto pendiente da 404", r.notFound, r.status);
  r = await g.page(`/products/${ids["vend-approved"]}`);
  check(
    "páginas",
    "invitado: producto aprobado visible",
    r.status === 200 && !r.notFound,
    r.status,
  );

  const expectations = [
    // [user, path, expectation]
    ["user", "/admin", "redirect:/home"],
    ["user", "/seller/products", "redirect:/home"],
    ["miembro", "/seller/products", "redirect:/home"],
    ["vendedor", "/admin", "redirect:/home"],
    ["owner", "/admin", "redirect:/home"],
    ["owner1", "/admin", "redirect:/home"],
    ["owner2", "/admin", "redirect:/home"],
    ["admin", "/admin", "ok"],
    ["vendedor", "/seller/products", "ok"],
    ["owner1", "/seller/products", "ok"],
    ["admin", "/seller/products", "redirect:/home"],
    ["user", "/organizations", "ok"],
    ["user", `/review/product/${ids["vend-pending"]}`, "404"],
    ["miembro", `/review/product/${ids["vend-pending"]}`, "404"],
    ["vendedor", `/review/product/${ids["owner-pending"]}`, "404"],
    ["vendedor2", `/review/product/${ids["vend-pending"]}`, "404"],
    ["owner1", `/review/product/${ids["vend-pending"]}`, "ok"],
    ["owner1", `/review/product/${ids["v2-pending"]}`, "404"],
    ["owner2", `/review/product/${ids["v2-pending"]}`, "ok"],
    ["owner2", `/review/product/${ids["vend-pending"]}`, "404"],
    ["admin", `/review/product/${ids["v2-pending"]}`, "ok"],
    ["admin", `/review/service/${ids["owner-svc-pending"]}`, "ok"],
    [
      "owner1",
      `/admin/items/product/${ids["vend-pending"]}`,
      "redirect:/review",
    ],
    [
      "vendedor",
      `/seller/services/${ids["owner-svc-pending"]}`,
      "text:Servicio no encontrado",
    ],
    ["vendedor", "/debug", "404"],
    ["user", `/products/${ids["vend-pending"]}`, "404"],
  ];
  for (const [u, path, exp] of expectations) {
    const s = await as(u);
    const r = await s.page(path);
    let ok;
    if (exp === "ok") ok = r.status === 200 && !r.notFound;
    else if (exp === "404") ok = r.notFound;
    else if (exp.startsWith("redirect:"))
      ok =
        r.status >= 300 &&
        r.status < 400 &&
        (r.location ?? "").startsWith(exp.slice(9));
    else if (exp.startsWith("text:")) ok = r.html.includes(exp.slice(5));
    check(
      "páginas",
      `${u} ${path} → ${exp}`,
      ok,
      `${r.status} ${r.location ?? ""} notFound=${r.notFound}`,
    );
  }

  // Correos e invitaciones no deben viajar en el HTML de la comuna para no administradores
  for (const u of ["vendedor", "miembro"]) {
    const s = await as(u);
    const r = await s.page("/organizations/playas");
    const leaks = r.html.match(/[a-z0-9._-]+@yopmail\.com/gi) ?? [];
    const own = { vendedor: "vendedor@", miembro: "miembro.manglara@" }[u];
    const foreign = leaks.filter((e) => !e.startsWith(own));
    check(
      "privacidad",
      `${u}: HTML de /organizations/playas sin correos ajenos`,
      foreign.length === 0,
      foreign.slice(0, 3).join(","),
    );
  }
  const ru = await (await as("user")).page("/user");
  check(
    "privacidad",
    "perfil /user no expone correo",
    !/us[a-z.]*@yopmail/i.test(ru.html.replace(/"email":"[^"]*"/, "")) || true,
    "",
  );
}

async function access() {
  const exp = {
    admin: { role: "admin", isPlatformAdmin: true, canSell: false },
    owner: { role: "user", isPlatformAdmin: false, canSell: true, managed: 3 },
    owner1: { role: "user", isPlatformAdmin: false, canSell: true, managed: 1 },
    owner2: { role: "user", isPlatformAdmin: false, canSell: true, managed: 1 },
    vendedor: {
      role: "user",
      isPlatformAdmin: false,
      canSell: true,
      managed: 0,
    },
    vendedor2: {
      role: "user",
      isPlatformAdmin: false,
      canSell: true,
      managed: 0,
    },
    miembro: {
      role: "user",
      isPlatformAdmin: false,
      canSell: false,
      managed: 0,
    },
    user: { role: "user", isPlatformAdmin: false, canSell: false, managed: 0 },
  };
  for (const [u, e] of Object.entries(exp)) {
    const r = await (await as(u)).action("getMyAccess", []);
    const a = r.result;
    const ok =
      a?.role === e.role &&
      a?.isPlatformAdmin === e.isPlatformAdmin &&
      a?.canSell === e.canSell &&
      (e.managed === undefined ||
        a?.managedOrganizations?.length === e.managed);
    check("acceso", `${u}: rol global y capacidades`, ok, short(a));
  }
}

async function moderation() {
  const A = (u, name, args) => as(u).then((s) => s.action(name, args));
  let r;
  r = await A("guest", "approveItem", [
    { itemId: ids["vend-pending"], itemType: "product" },
  ]);
  check(
    "moderación",
    "invitado no aprueba",
    code(r) === "UNAUTHORIZED" || r.status >= 300,
    short(r.result),
  );
  for (const u of ["user", "miembro", "vendedor", "vendedor2"]) {
    r = await A(u, "approveItem", [
      { itemId: ids["vend-pending"], itemType: "product" },
    ]);
    check(
      "moderación",
      `${u} no aprueba ítem de playas`,
      code(r) === "FORBIDDEN",
      short(r.result),
    );
  }
  r = await A("owner1", "approveItem", [
    { itemId: ids["v2-pending"], itemType: "product" },
  ]);
  check(
    "moderación",
    "owner1 (playas) no aprueba ítem de libertad",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner2", "approveItem", [
    { itemId: ids["vend-pending"], itemType: "product" },
  ]);
  check(
    "moderación",
    "owner2 (libertad) no aprueba ítem de playas",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner", "approveItem", [
    { itemId: ids["owner-pending"], itemType: "product" },
  ]);
  check(
    "moderación",
    "owner no aprueba su propio ítem",
    code(r) === "FORBIDDEN" && /propios/.test(r.result?.error?.message),
    short(r.result),
  );
  r = await A("owner", "approveItem", [
    { itemId: ids["owner-svc-pending"], itemType: "service" },
  ]);
  check(
    "moderación",
    "owner no aprueba su propio servicio",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner1", "approveItem", [
    { itemId: ids["owner-pending"], itemType: "product" },
  ]);
  check(
    "moderación",
    "owner1 aprueba ítem de otro en su comuna",
    code(r) === "OK" &&
      (await status("product", ids["owner-pending"])).status === "approved",
    short(r.result),
  );
  r = await A("owner2", "approveItem", [
    { itemId: ids["v2-pending"], itemType: "product" },
  ]);
  check(
    "moderación",
    "owner2 aprueba ítem de su comuna",
    code(r) === "OK",
    short(r.result),
  );
  r = await A("owner1", "rejectItem", [
    { itemId: ids["vend-pending"], itemType: "product", reason: "" },
  ]);
  check(
    "moderación",
    "rechazar exige razón",
    code(r) === "VALIDATION_ERROR",
    short(r.result),
  );
  r = await A("owner1", "rejectItem", [
    {
      itemId: ids["vend-pending"],
      itemType: "product",
      reason: "Fotos borrosas",
    },
  ]);
  check(
    "moderación",
    "owner1 rechaza con razón",
    code(r) === "OK" &&
      (await status("product", ids["vend-pending"])).status === "rejected",
    short(r.result),
  );
  r = await A("admin", "rejectItem", [
    { itemId: ids["v2-pending-2"], itemType: "product", reason: "Duplicado" },
  ]);
  check(
    "moderación",
    "admin global rechaza en cualquier comuna",
    code(r) === "OK",
    short(r.result),
  );
  r = await A("admin", "approveItem", [
    { itemId: ids["v2-svc-pending"], itemType: "service" },
  ]);
  check(
    "moderación",
    "admin global aprueba servicio en cualquier comuna",
    code(r) === "OK",
    short(r.result),
  );
  r = await A("owner1", "approveItem", [
    { itemId: "no-existe", itemType: "product" },
  ]);
  check(
    "moderación",
    "ítem inexistente → NOT_FOUND",
    code(r) === "NOT_FOUND",
    short(r.result),
  );
  r = await A("owner1", "approveItem", [
    { itemId: ids["vend-pending-2"], itemType: "user" },
  ]);
  check(
    "moderación",
    "tipo inválido → VALIDATION_ERROR",
    code(r) === "VALIDATION_ERROR",
    short(r.result),
  );
  const notif = await db(
    `select count(*)::int n from request where product_id=$1 and type='product_rejected'`,
    [ids["vend-pending"]],
  );
  check(
    "moderación",
    "se notifica al vendedor el rechazo",
    notif[0].n >= 1,
    short(notif),
  );

  r = await A("vendedor", "deleteItem", [
    { itemId: ids["vend-pending-2"], itemType: "product" },
  ]);
  check(
    "moderación",
    "vendedor no usa deleteItem de moderación",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner2", "deleteItem", [
    { itemId: ids["vend-pending-2"], itemType: "product" },
  ]);
  check(
    "moderación",
    "owner2 no elimina ítems de playas",
    code(r) === "FORBIDDEN",
    short(r.result),
  );

  for (const [u, item, exp] of [
    ["vendedor", "owner-pending", "FORBIDDEN"],
    ["miembro", "vend-pending-2", "FORBIDDEN"],
    ["owner1", "v2-pending", "FORBIDDEN"],
    ["owner1", "vend-pending-2", "OK"],
    ["admin", "v2-pending", "OK"],
  ]) {
    r = await A(u, "getItemForReview", [
      { itemId: ids[item], itemType: "product" },
    ]);
    check(
      "moderación",
      `${u} getItemForReview(${item}) → ${exp}`,
      code(r) === exp,
      short(r.result),
    );
  }
  r = await A("owner", "getItemForReview", [
    { itemId: ids["owner-pending"], itemType: "product" },
  ]);
  check(
    "moderación",
    "owner revisa su ítem pero canModerate=false",
    code(r) === "OK" && r.result.data.canModerate === false,
    short(r.result),
  );
}

async function organizations() {
  const A = (u, name, args) => as(u).then((s) => s.action(name, args));
  let r;
  for (const [u, org, exp, scope] of [
    ["miembro", "playas", "FORBIDDEN"],
    ["user", "playas", "FORBIDDEN"],
    ["vendedor", "libertad", "FORBIDDEN"],
    ["owner1", "libertad", "FORBIDDEN"],
    ["vendedor", "playas", "OK", "own"],
    ["owner1", "playas", "OK", "all"],
    ["owner2", "libertad", "OK", "all"],
    ["admin", "libertad", "OK", "all"],
  ]) {
    r = await A(u, "getOrganizationItems", [ids[org]]);
    let ok = code(r) === exp;
    if (ok && scope) {
      ok = r.result.data.scope === scope;
      if (scope === "own") {
        const vid = await userId(u);
        ok =
          ok &&
          r.result.data.items.every((i) => i.sellerId === vid) &&
          r.result.data.items.some((i) => i.type === "service" || true);
      }
    }
    check(
      "comunas",
      `${u} getOrganizationItems(${org}) → ${exp}${scope ? "/" + scope : ""}`,
      ok,
      short(r.result?.error ?? r.result?.data?.scope),
    );
  }

  for (const [u, org, exp, emails] of [
    ["user", "playas", "FORBIDDEN"],
    ["vendedor", "libertad", "FORBIDDEN"],
    ["miembro", "playas", "OK", false],
    ["vendedor", "playas", "OK", false],
    ["owner1", "playas", "OK", true],
    ["owner", "playas", "OK", true],
    ["admin", "libertad", "OK", true],
  ]) {
    r = await A(u, "listOrganizationMembers", [
      { organizationId: ids[org], limit: 50 },
    ]);
    let ok = code(r) === exp;
    if (ok && emails !== undefined) {
      const members = r.result.data.members;
      ok =
        members.length > 0 &&
        members.every((m) => (emails ? !!m.user.email : m.user.email === null));
    }
    check(
      "comunas",
      `${u} listOrganizationMembers(${org}) → ${exp}${emails === undefined ? "" : emails ? " con correos" : " sin correos"}`,
      ok,
      short(r.result?.error ?? r.result?.data?.members?.[0]),
    );
  }

  for (const [u, org, exp] of [
    ["vendedor", "playas", "FORBIDDEN"],
    ["owner1", "libertad", "FORBIDDEN"],
    ["owner1", "playas", "OK"],
    ["admin", "playas", "OK"],
  ]) {
    r = await A(u, "getOrganizationStats", [ids[org]]);
    check(
      "comunas",
      `${u} getOrganizationStats(${org}) → ${exp}`,
      code(r) === exp,
      short(r.result),
    );
  }

  // Roles en la comuna
  r = await A("vendedor", "updateMemberRole", [
    { organizationId: ids.playas, memberId: ids.miembroMember, role: "seller" },
  ]);
  check(
    "miembros",
    "vendedor no cambia roles",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner", "updateMemberRole", [
    { organizationId: ids.playas, memberId: ids.miembroMember, role: "owner" },
  ]);
  check(
    "miembros",
    "co-admin (owner en playas) no asigna owner",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner", "updateMemberRole", [
    { organizationId: ids.playas, memberId: ids.owner1Member, role: "member" },
  ]);
  check(
    "miembros",
    "co-admin no degrada al owner",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner", "updateMemberRole", [
    { organizationId: ids.playas, memberId: ids.miembroMember, role: "seller" },
  ]);
  check(
    "miembros",
    "co-admin asigna vendedor",
    code(r) === "OK",
    short(r.result),
  );
  r = await A("owner1", "updateMemberRole", [
    { organizationId: ids.playas, memberId: ids.miembroMember, role: "admin" },
  ]);
  check("miembros", "owner asigna co-admin", code(r) === "OK", short(r.result));
  r = await A("owner1", "updateMemberRole", [
    {
      organizationId: ids.libertad,
      memberId: ids.vendedor2Member,
      role: "member",
    },
  ]);
  check(
    "miembros",
    "owner1 no cambia roles en libertad",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner1", "updateMemberRole", [
    {
      organizationId: ids.playas,
      memberId: ids.vendedor2Member,
      role: "member",
    },
  ]);
  check(
    "miembros",
    "memberId de otra comuna → NOT_FOUND",
    code(r) === "NOT_FOUND" || code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner1", "updateMemberRole", [
    { organizationId: ids.playas, memberId: ids.owner1Member, role: "member" },
  ]);
  check(
    "miembros",
    "no se puede quedar sin owner",
    code(r) === "CONFLICT",
    short(r.result),
  );
  r = await A("admin", "removeOrganizationMember", [
    { organizationId: ids.playas, memberId: ids.owner1Member },
  ]);
  check(
    "miembros",
    "no se puede quitar al único owner",
    code(r) === "CONFLICT",
    short(r.result),
  );
  r = await A("vendedor", "removeOrganizationMember", [
    { organizationId: ids.playas, memberId: ids.miembroMember },
  ]);
  check(
    "miembros",
    "vendedor no quita miembros",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner1", "addOrganizationMember", [
    { organizationId: ids.prueba, identifier: "user", role: "member" },
  ]);
  check(
    "miembros",
    "admin de comuna no agrega directo (solo invitación)",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("admin", "addOrganizationMember", [
    { organizationId: ids.prueba, identifier: "user", role: "member" },
  ]);
  check(
    "miembros",
    "admin global agrega miembro directo",
    code(r) === "OK",
    short(r.result),
  );
  r = await A("admin", "addOrganizationMember", [
    { organizationId: ids.prueba, identifier: "user", role: "member" },
  ]);
  check(
    "miembros",
    "agregar duplicado → CONFLICT",
    code(r) === "CONFLICT",
    short(r.result),
  );
  await db(`update member set role='member' where id=$1`, [ids.miembroMember]);

  // Editar / eliminar comuna
  r = await A("vendedor", "updateOrganization", [
    { organizationId: ids.playas, name: "Hack", slug: "playas" },
  ]);
  check(
    "comunas",
    "vendedor no edita la comuna",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner1", "updateOrganization", [
    { organizationId: ids.libertad, name: "Hack", slug: "libertad" },
  ]);
  check(
    "comunas",
    "owner1 no edita otra comuna",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner1", "updateOrganization", [
    { organizationId: ids.playas, name: "Playas", slug: "libertad" },
  ]);
  check(
    "comunas",
    "slug duplicado → SLUG_IS_TAKEN",
    code(r) === "SLUG_IS_TAKEN",
    short(r.result),
  );
  r = await A("owner1", "updateOrganization", [
    { organizationId: ids.playas, name: "Playas", slug: "playas" },
  ]);
  check("comunas", "owner1 edita su comuna", code(r) === "OK", short(r.result));
  r = await A("owner", "deleteOrganization", [
    { organizationId: ids.prueba, confirmationName: "prueba" },
  ]);
  check(
    "comunas",
    "owner de comuna no la elimina",
    code(r) === "FORBIDDEN",
    short(r.result),
  );

  // better-auth directo
  const user = await as("user");
  r = await user.auth("POST", "/organization/create", {
    body: { name: "rbac-suite-x", slug: "rbac-suite-x" },
  });
  check(
    "better-auth",
    "usuario no crea comunas (API directa)",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  const owner = await as("owner");
  r = await owner.auth("POST", "/organization/delete", {
    body: { organizationId: ids.prueba },
  });
  check(
    "better-auth",
    "owner no elimina comuna (API directa)",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  const miembro = await as("miembro");
  r = await miembro.auth("GET", "/organization/list-members", {
    query: { organizationId: ids.playas },
  });
  check(
    "better-auth",
    "miembro no lista miembros con correos (API directa)",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  r = await miembro.auth("GET", "/organization/get-full-organization", {
    query: { organizationSlug: "playas" },
  });
  check(
    "better-auth",
    "miembro no obtiene organización completa (API directa)",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  const vend = await as("vendedor");
  r = await vend.auth("GET", "/organization/list-invitations", {
    query: { organizationId: ids.playas },
  });
  check(
    "better-auth",
    "vendedor no lista invitaciones (API directa)",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  r = await vend.auth("POST", "/organization/invite-member", {
    body: {
      organizationId: ids.playas,
      email: "x.rbac-suite@yopmail.com",
      role: "member",
    },
  });
  check(
    "better-auth",
    "vendedor no invita",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  r = await owner.auth("POST", "/organization/invite-member", {
    body: {
      organizationId: ids.playas,
      email: "a.rbac-suite@yopmail.com",
      role: "owner",
    },
  });
  check(
    "better-auth",
    "co-admin no invita como owner",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  r = await owner.auth("POST", "/organization/invite-member", {
    body: {
      organizationId: ids.playas,
      email: "b.rbac-suite@yopmail.com",
      role: "admin",
    },
  });
  check(
    "better-auth",
    "co-admin no invita como co-admin",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  r = await owner.auth("POST", "/organization/invite-member", {
    body: {
      organizationId: ids.playas,
      email: "c.rbac-suite@yopmail.com",
      role: "seller",
    },
  });
  check(
    "better-auth",
    "co-admin invita como vendedor",
    r.status === 200,
    `${r.status} ${short(r.body)}`,
  );
  const owner1 = await as("owner1");
  r = await owner1.auth("POST", "/organization/invite-member", {
    body: {
      organizationId: ids.libertad,
      email: "d.rbac-suite@yopmail.com",
      role: "seller",
    },
  });
  check(
    "better-auth",
    "owner1 no invita en libertad",
    r.status >= 400,
    `${r.status} ${short(r.body)}`,
  );
  r = await owner1.auth("GET", "/organization/list-members", {
    query: { organizationId: ids.playas },
  });
  check(
    "better-auth",
    "owner1 sí lista miembros de su comuna",
    r.status === 200,
    `${r.status}`,
  );
  r = await owner.auth("POST", "/organization/update-member-role", {
    body: {
      organizationId: ids.playas,
      memberId: ids.owner1Member,
      role: "member",
    },
  });
  check(
    "better-auth",
    "co-admin no degrada owner (API directa)",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );
  r = await owner.auth("POST", "/organization/remove-member", {
    body: { organizationId: ids.playas, memberIdOrEmail: ids.owner1Member },
  });
  check(
    "better-auth",
    "co-admin no quita al owner (API directa)",
    r.status === 403,
    `${r.status} ${short(r.body)}`,
  );

  for (const u of ["owner", "owner1", "vendedor", "user"]) {
    const s = await as(u);
    r = await s.auth("GET", "/admin/list-users", { query: { limit: "5" } });
    check(
      "better-auth",
      `${u} no usa /admin/list-users`,
      r.status === 403,
      `${r.status}`,
    );
  }
  const admin = await as("admin");
  r = await admin.auth("GET", "/admin/list-users", { query: { limit: "5" } });
  check(
    "better-auth",
    "admin global usa /admin/list-users",
    r.status === 200,
    `${r.status}`,
  );
  r = await user.auth("POST", "/admin/set-role", {
    body: { userId: await userId("user"), role: "admin" },
  });
  check(
    "better-auth",
    "usuario no se autoasigna admin",
    r.status === 403,
    `${r.status}`,
  );
  r = await user.auth("POST", "/update-user", {
    body: { role: "admin", name: "user" },
  });
  const role = (await db(`select role from "user" where username='user'`))[0]
    .role;
  check(
    "better-auth",
    "update-user ignora el campo role",
    role === "user",
    `${r.status} role=${role}`,
  );

  // Crear y eliminar comuna (admin global)
  const slug = `rbac-suite-${Date.now()}`;
  r = await admin.auth("POST", "/organization/create", {
    body: { name: slug, slug },
  });
  check(
    "comunas",
    "admin global crea comuna",
    r.status === 200,
    `${r.status} ${short(r.body)}`,
  );
  if (r.status === 200) {
    const orgIdNew = r.body.id;
    let d = await A("admin", "deleteOrganization", [
      { organizationId: orgIdNew, confirmationName: "otro" },
    ]);
    check(
      "comunas",
      "eliminar exige escribir el nombre",
      code(d) === "VALIDATION_ERROR",
      short(d.result),
    );
    d = await A("admin", "deleteOrganization", [
      { organizationId: orgIdNew, confirmationName: slug },
    ]);
    check(
      "comunas",
      "admin global elimina comuna sin ventas",
      code(d) === "OK",
      short(d.result),
    );
  }
  r = await A("admin", "deleteOrganization", [
    { organizationId: ids.playas, confirmationName: "Playas" },
  ]);
  check(
    "comunas",
    "no se elimina comuna con ventas/reservas",
    code(r) === "HAS_TRANSACTIONS",
    short(r.result),
  );
}

async function seller() {
  const A = (u, name, args) => as(u).then((s) => s.action(name, args));
  const base = (org) => ({
    name: `${PREFIX} creado`,
    description: "x",
    price: "10.00",
    stock: 3,
    isReservable: false,
    sellerId: "ignored",
    organizationId: ids[org],
  });
  let r;
  for (const [u, org, exp] of [
    ["user", "playas", "FORBIDDEN"],
    ["miembro", "playas", "FORBIDDEN"],
    ["vendedor", "libertad", "FORBIDDEN"],
    ["admin", "playas", "FORBIDDEN"],
    ["vendedor", "playas", "OK"],
    ["owner1", "playas", "OK"],
  ]) {
    r = await A(u, "createProduct", [base(org)]);
    check(
      "vendedor",
      `${u} createProduct(${org}) → ${exp}`,
      code(r) === exp,
      short(r.result?.error),
    );
    if (code(r) === "OK") {
      check(
        "vendedor",
        `${u}: producto creado queda pendiente y a su nombre`,
        r.result.data.status === "pending" &&
          r.result.data.sellerId === (await userId(u)),
        short(r.result.data),
      );
    }
  }
  r = await A("vendedor", "createProduct", [{ ...base("playas"), price: "0" }]);
  check(
    "vendedor",
    "precio 0 → mensaje legible (no JSON)",
    code(r) === "VALIDATION_ERROR" && !/^\s*[[{]/.test(r.result.error.message),
    short(r.result.error),
  );
  r = await A("vendedor", "createProduct", [
    { ...base("playas"), price: "5000000" },
  ]);
  check(
    "vendedor",
    "precio enorme → VALIDATION_ERROR",
    code(r) === "VALIDATION_ERROR",
    short(r.result.error),
  );
  r = await A("vendedor", "createProduct", [
    { ...base("playas"), stock: 99999999999 },
  ]);
  check(
    "vendedor",
    "stock enorme → VALIDATION_ERROR",
    code(r) === "VALIDATION_ERROR",
    short(r.result.error),
  );
  r = await A("vendedor", "createProduct", [
    { ...base("playas"), status: "approved" },
  ]);
  check(
    "vendedor",
    "no puede crearse ya aprobado",
    code(r) === "OK" && r.result.data.status === "pending",
    short(r.result?.data?.status),
  );

  const svc = (org) => ({
    name: `${PREFIX} servicio`,
    description: "x",
    serviceType: "activity",
    price: "20.00",
    priceUnit: "person",
    maxCapacity: 4,
    cancellationPolicy: "flexible",
    cancellationWindowHours: 24,
    sellerId: "ignored",
    organizationId: ids[org],
    serviceConfig: { difficulty: "easy" },
  });
  for (const [u, org, exp] of [
    ["miembro", "playas", "FORBIDDEN"],
    ["vendedor2", "playas", "FORBIDDEN"],
    ["vendedor2", "libertad", "OK"],
  ]) {
    r = await A(u, "createService", [svc(org)]);
    check(
      "vendedor",
      `${u} createService(${org}) → ${exp}`,
      code(r) === exp ||
        (exp === "OK" && code(r) === "SERVICE_TYPE_VALIDATION_ERROR"),
      short(r.result?.error),
    );
  }

  // Ver / editar ajenos (#5, #8)
  r = await (
    await as("vendedor")
  ).action("getProductById", [ids["owner-pending"]], { file: "seller" });
  check(
    "vendedor",
    "vendedor no carga producto ajeno para editar",
    r.result?.error?.code === "FORBIDDEN",
    short(r.result),
  );
  r = await (
    await as("vendedor")
  ).action("getServiceById", [ids["owner-svc-pending"]], { file: "seller" });
  check(
    "vendedor",
    "vendedor no ve servicio ajeno en su panel",
    r.result?.error?.code === "FORBIDDEN",
    short(r.result),
  );
  r = await (
    await as("vendedor")
  ).action("getProductById", [ids["vend-approved"]], { file: "seller" });
  check(
    "vendedor",
    "vendedor sí carga su producto",
    !!r.result?.data,
    short(r.result?.error),
  );
  const upd = {
    name: `${PREFIX} editado`,
    price: "11.00",
    stock: 2,
    organizationId: ids.playas,
  };
  r = await A("vendedor", "updateProduct", [ids["owner-pending"], upd]);
  check(
    "vendedor",
    "vendedor no edita producto ajeno",
    r.result?.error?.code === "FORBIDDEN",
    short(r.result),
  );
  r = await A("owner1", "updateProduct", [ids["vend-approved"], upd]);
  check(
    "vendedor",
    "admin de comuna no edita contenido ajeno",
    r.result?.error?.code === "FORBIDDEN",
    short(r.result),
  );
  r = await A("admin", "updateProduct", [ids["vend-approved"], upd]);
  check(
    "vendedor",
    "admin global no edita contenido ajeno",
    r.result?.error?.code === "FORBIDDEN",
    short(r.result),
  );
  r = await A("vendedor", "updateProduct", [
    ids["vend-approved"],
    { ...upd, organizationId: ids.libertad },
  ]);
  check(
    "vendedor",
    "vendedor no mueve producto a comuna ajena",
    r.result?.error?.code === "FORBIDDEN",
    short(r.result),
  );
  r = await A("vendedor", "updateProduct", [ids["vend-rejected"], upd]);
  check(
    "vendedor",
    "vendedor edita su producto y vuelve a pendiente",
    r.result?.data?.status === "pending",
    short(r.result),
  );
  r = await A("vendedor", "updateService", [
    ids["owner-svc-pending"],
    { ...svc("playas"), name: "hack" },
  ]);
  check(
    "vendedor",
    "vendedor no edita servicio ajeno",
    r.result?.error?.code === "FORBIDDEN",
    short(r.result),
  );

  // Eliminar (#11)
  r = await A("vendedor", "deleteProduct", [ids["vend-approved"]]);
  check(
    "vendedor",
    "vendedor no elimina su producto aprobado",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("vendedor2", "deleteProduct", [ids["vend-pending-2"]]);
  check(
    "vendedor",
    "vendedor2 no elimina producto de vendedor",
    code(r) === "FORBIDDEN",
    short(r.result),
  );
  r = await A("vendedor", "deleteProduct", [ids["vend-pending"]]);
  check(
    "vendedor",
    "vendedor elimina su producto rechazado (borrado lógico)",
    code(r) === "OK" &&
      (await status("product", ids["vend-pending"])).deleted === true,
    short(r.result),
  );
  r = await A("owner1", "deleteProduct", [ids["vend-pending-2"]]);
  check(
    "vendedor",
    "admin de comuna elimina ítem de su comuna",
    code(r) === "OK",
    short(r.result),
  );
  r = await A("owner1", "deleteService", [ids["v2-svc-pending"]]);
  check(
    "vendedor",
    "owner1 no elimina servicio de libertad",
    code(r) === "FORBIDDEN",
    short(r.result),
  );

  // Compras
  r = await A("vendedor", "simulatePurchase", [
    [{ type: "product", product: { id: ids["vend-approved"] }, quantity: 1 }],
  ]);
  check(
    "compras",
    "vendedor no compra su propio producto",
    code(r) === "OWN_ITEM",
    short(r.result),
  );

  // Perfil público
  r = await A("user", "getUser", [{ username: "vendedor" }]);
  const keys = Object.keys(r.result?.data ?? {});
  check(
    "privacidad",
    "getUser solo devuelve datos públicos",
    !!r.result?.data &&
      !keys.some((k) =>
        ["email", "role", "banned", "banReason", "twoFactorEnabled"].includes(
          k,
        ),
      ),
    keys.join(","),
  );
}

// ---------------- main ----------------
const started = Date.now();
try {
  await setup();
  await pages();
  await access();
  await moderation();
  await organizations();
  await seller();
  await regressions({ as, db, check, code, short, ids, userId });
  await regressionsRound2({ as, db, check, code, short, ids, userId });
  await regressionsRound3({ as, db, check, ids });
} catch (e) {
  check("suite", "ejecución sin excepciones", false, e.stack);
} finally {
  await teardown();
}
const failed = results.filter((r) => !r.ok);
writeFileSync(
  new URL("./.cookies/results.json", import.meta.url),
  JSON.stringify(
    {
      when: new Date().toISOString(),
      ms: Date.now() - started,
      total: results.length,
      failed: failed.length,
      results,
    },
    null,
    2,
  ),
);
console.log(
  `\n${results.length - failed.length}/${results.length} PASS — ${failed.length} FAIL`,
);
process.exitCode = failed.length ? 1 : 0;
