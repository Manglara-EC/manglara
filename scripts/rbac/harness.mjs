// Arnés de pruebas RBAC para Manglara (servidor en http://localhost:3000).
// Usa las cuentas de scripts/rbac/seed-test-users.ts y la contraseña TEST_PASSWORD.
//
// Uso como librería:
//   import { as, listActions } from "./harness.mjs";
//   const s = await as("vendedor");                // inicia sesión (cookie cacheada)
//   await s.page("/admin");                         // {status, location, html}
//   await s.auth("GET", "/organization/list-members", { query: { organizationId } });
//   await s.action("approveItem", [{ itemId, itemType: "product" }]);
//   const g = guest();                              // sin sesión
//
// Uso CLI rápido:
//   node harness.mjs page <user|guest> <path>
//   node harness.mjs auth <user|guest> <METHOD> <path> [jsonBody]
//   node harness.mjs action <user|guest> <exportName> '<jsonArgsArray>'
//   node harness.mjs actions            (lista server actions disponibles)
//   node harness.mjs db "<select ...>"  (consulta SQL de solo lectura)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const BASE = process.env.BASE_URL ?? "http://localhost:3000";
// Raíz del repo (este archivo vive en scripts/rbac/)
const PROJECT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = new URL(".", import.meta.url);
// Cookies de sesión cacheadas por usuario (HARNESS_COOKIES=nombre.json); no se versionan
const COOKIE_FILE = new URL(
  `./.cookies/${process.env.HARNESS_COOKIES ?? "cookies.json"}`,
  HERE,
);
const PASSWORD = process.env.TEST_PASSWORD;
if (!PASSWORD) {
  throw new Error(
    "Define TEST_PASSWORD con la contraseña de las cuentas de prueba",
  );
}

export const USERS = {
  admin: "Administrador global (user.role=admin)",
  owner: "admin en playas, owner en prueba y libertad",
  owner1: "owner en playas",
  owner2: "owner en libertad",
  vendedor: "seller en playas",
  vendedor2: "seller en libertad",
  miembro: "member en playas",
  user: "cliente sin comunas",
};

const loadCookies = () =>
  existsSync(COOKIE_FILE) ? JSON.parse(readFileSync(COOKIE_FILE, "utf8")) : {};
const saveCookies = (c) => {
  mkdirSync(new URL("./.cookies/", HERE), { recursive: true });
  writeFileSync(COOKIE_FILE, JSON.stringify(c, null, 2));
};

const parseSetCookie = (res) => {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).filter((c) => !/=$/.test(c));
};

async function signIn(username, attempt = 0) {
  const res = await fetch(`${BASE}/api/auth/sign-in/username`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ username, password: PASSWORD }),
  });
  // El inicio de sesión tiene límite de intentos: esperar y reintentar
  if (res.status === 429 && attempt < 8) {
    const wait = Number(res.headers.get("x-retry-after") ?? 11);
    await new Promise((r) => setTimeout(r, (wait + 1) * 1000));
    return signIn(username, attempt + 1);
  }
  const cookies = parseSetCookie(res);
  if (!res.ok || cookies.length === 0) {
    throw new Error(
      `login ${username} falló: ${res.status} ${await res.text()}`,
    );
  }
  return cookies.join("; ");
}

async function isValid(cookie) {
  const res = await fetch(`${BASE}/api/auth/get-session`, {
    headers: { cookie, origin: BASE },
  });
  if (!res.ok) return false;
  const body = await res.json().catch(() => null);
  return !!body?.user;
}

export async function cookieFor(username, { fresh = false } = {}) {
  const jar = loadCookies();
  if (!fresh && jar[username] && (await isValid(jar[username])))
    return jar[username];
  const cookie = await signIn(username);
  const latest = loadCookies();
  latest[username] = cookie;
  saveCookies(latest);
  return cookie;
}

// ---------- server actions ----------
let manifestCache;
export function listActions() {
  if (!manifestCache) {
    const m = JSON.parse(
      readFileSync(
        `${PROJECT}/.next/server/server-reference-manifest.json`,
        "utf8",
      ),
    );
    manifestCache = Object.entries(m.node).map(([id, v]) => ({
      id,
      name: v.exportedName,
      file: (v.filename ?? "")
        .replace(/^.*[\\/]src[\\/]/, "src/")
        .replace(/\\/g, "/"),
      pages: Object.keys(v.workers),
    }));
  }
  return manifestCache;
}

const pageToUrl = (page) =>
  "/" +
  page
    .replace(/^app\//, "")
    .replace(/\/page$/, "")
    .split("/")
    .filter((seg) => !/^\(.*\)$/.test(seg))
    .map((seg) => (seg.startsWith("[") ? "x" : seg))
    .join("/");

function parseFlight(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([0-9a-f]+):(.*)$/);
    if (!m) continue;
    try {
      out[m[1]] = JSON.parse(m[2]);
    } catch {
      out[m[1]] = m[2];
    }
  }
  return out["1"] ?? out;
}

export async function callAction(cookie, exportName, args = [], { file } = {}) {
  const candidates = listActions().filter(
    (a) => a.name === exportName && (!file || a.file.includes(file)),
  );
  if (candidates.length === 0)
    throw new Error(`Acción no encontrada: ${exportName}`);
  const action = candidates[0];
  const url = BASE + pageToUrl(action.pages[0]);
  const res = await fetch(url, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Next-Action": action.id,
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      origin: BASE,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  return {
    status: res.status,
    location:
      res.headers.get("location") ?? res.headers.get("x-action-redirect"),
    result: parseFlight(text),
    raw: text.slice(0, 2000),
  };
}

// ---------- pages & better-auth ----------
export async function getPage(cookie, path) {
  const res = await fetch(BASE + path, {
    redirect: "manual",
    headers: { ...(cookie ? { cookie } : {}), origin: BASE },
  });
  const html = await res.text();
  return {
    status: res.status,
    location: res.headers.get("location"),
    html,
    // El componente not-found viaja en el payload de toda página: solo cuenta
    // el estado 404 o el digest del error notFound().
    notFound: res.status === 404 || /NEXT_HTTP_ERROR_FALLBACK;404/.test(html),
  };
}

export async function callAuth(cookie, method, path, { body, query } = {}) {
  const qs = query ? "?" + new URLSearchParams(query).toString() : "";
  const res = await fetch(`${BASE}/api/auth${path}${qs}`, {
    method,
    headers: {
      origin: BASE,
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 500);
  }
  return { status: res.status, body: json };
}

export async function as(username) {
  const cookie = username === "guest" ? null : await cookieFor(username);
  return {
    username,
    cookie,
    page: (path) => getPage(cookie, path),
    auth: (method, path, opts) => callAuth(cookie, method, path, opts),
    action: (name, args, opts) => callAction(cookie, name, args, opts),
  };
}
export const guest = () => as("guest");

// ---------- DB (solo lectura para verificar estado) ----------
export async function db(sql, params = []) {
  const require = createRequire(PROJECT + "/package.json");
  const { Pool } = require("@neondatabase/serverless");
  const env = Object.fromEntries(
    readFileSync(PROJECT + "/.env", "utf8")
      .split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [
        l.slice(0, l.indexOf("=")),
        l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, ""),
      ]),
  );
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    return (await pool.query(sql, params)).rows;
  } finally {
    await pool.end();
  }
}

// ---------- CLI ----------
if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())
) {
  const [cmd, user, ...rest] = process.argv.slice(2);
  const show = (x) => console.log(JSON.stringify(x, null, 2));
  if (cmd === "actions")
    show(listActions().map((a) => `${a.name}  (${a.file})`));
  else if (cmd === "db") show(await db(user));
  else {
    const s = await as(user);
    if (cmd === "page") {
      const r = await s.page(rest[0]);
      show({
        status: r.status,
        location: r.location,
        notFound: r.notFound,
        length: r.html.length,
      });
    } else if (cmd === "auth") {
      const [method, path, body] = rest;
      show(
        await s.auth(
          method,
          path,
          method === "GET"
            ? { query: body ? JSON.parse(body) : undefined }
            : { body: body ? JSON.parse(body) : undefined },
        ),
      );
    } else if (cmd === "action") {
      const r = await s.action(rest[0], rest[1] ? JSON.parse(rest[1]) : []);
      show({ status: r.status, location: r.location, result: r.result });
    }
  }
}
