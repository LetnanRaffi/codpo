/** Push semua migration ke Supabase via Management API (idempotent). */
import { readFileSync, readdirSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const ref = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)[1];
const token = JSON.parse(readFileSync("/home/pasha/.local/share/opencode/mcp-auth.json", "utf8"))
  .supabase?.tokens?.accessToken;

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text;
}

await query(
  `create table if not exists public._codpo_migrations(filename text primary key, applied_at timestamptz not null default now())`,
);

const files = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
let fail = 0;
for (const f of files) {
  const applied = await query(
    `select 1 from public._codpo_migrations where filename = '${f}'`,
  );
  if (applied !== "[]") {
    console.log(`skip ${f}`);
    continue;
  }
  try {
    await query(readFileSync(`supabase/migrations/${f}`, "utf8"));
    await query(`insert into public._codpo_migrations(filename) values ('${f}')`);
    console.log(`OK   ${f}`);
  } catch (e) {
    console.error(`FAIL ${f}\n     ${e.message}`);
    fail++;
    break; // stop di failure pertama biar urutan terjaga
  }
}
process.exit(fail ? 1 : 0);
