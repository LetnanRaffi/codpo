/**
 * Eksekusi SQL via Supabase Management API (OAuth token dari opencode MCP auth).
 * Usage: node scripts/mgmt-exec.mjs <file.sql> [--json]
 *        node scripts/mgmt-exec.mjs --sql "select 1"
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const ref = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)[1];

const mcpAuth = JSON.parse(
  readFileSync("/home/pasha/.local/share/opencode/mcp-auth.json", "utf8"),
);
const token = mcpAuth.supabase?.tokens?.accessToken ?? mcpAuth.supabase?.accessToken;
if (!token) throw new Error("token supabase belum ada — jalankan opencode mcp auth supabase");

const [, , arg1, arg2] = process.argv;
let sql;
if (arg1 === "--sql") sql = arg2;
else sql = readFileSync(arg1, "utf8");
const showJson = process.argv.includes("--json");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}:`, text.slice(0, 500));
  process.exit(1);
}
console.log(showJson ? text : `OK (${text.length} bytes response)`);
