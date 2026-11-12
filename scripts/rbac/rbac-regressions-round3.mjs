// Regresiones de la tercera ronda (verificadores independientes).
export async function regressionsRound3({ as, db, check, ids }) {
  let r;

  // Un owner no abandona la comuna por la API (evita quedar sin owner por carrera)
  const owner1 = await as("owner1");
  r = await owner1.auth("POST", "/organization/leave", {
    body: { organizationId: ids.playas },
  });
  const stillOwner = (
    await db(`select role from member where id=$1`, [ids.owner1Member])
  )[0]?.role;
  check(
    "regresión",
    "un owner no sale de la comuna por la API",
    r.status === 403 && stillOwner === "owner",
    `${r.status} role=${stillOwner}`,
  );

  // Un miembro sí puede salir (y se restaura la membresía con el mismo id)
  const miembro = await as("miembro");
  r = await miembro.auth("POST", "/organization/leave", {
    body: { organizationId: ids.playas },
  });
  const gone =
    (
      await db(`select count(*)::int n from member where id=$1`, [
        ids.miembroMember,
      ])
    )[0].n === 0;
  check(
    "regresión",
    "un miembro puede salir de la comuna",
    r.status === 200 && gone,
    `${r.status} gone=${gone}`,
  );
  if (gone) {
    await db(
      `insert into member (id, organization_id, user_id, role, created_at)
       values ($1, $2, (select id from "user" where username='miembro'), 'member', now())`,
      [ids.miembroMember, ids.playas],
    );
  }
}
