import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const token = JSON.parse(readFileSync("/home/pasha/.local/share/opencode/mcp-auth.json", "utf8"))
  .supabase.tokens.accessToken;

async function sql(q) {
  const res = await fetch("https://api.supabase.com/v1/projects/ehoytoerkxameyproivh/database/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  return res.text();
}

const stamp = Date.now();
const ea = `sa${stamp}@example.com`;
const eb = `ba${stamp}@example.com`;

const a = await admin.auth.admin.createUser({ email: ea, password: "password123", email_confirm: true, user_metadata: { name: "Seller X" } });
console.log("createUser A resp:", JSON.stringify({err:a.error?.message, uid:a.data?.user?.id}));
if (a.error || !a.data?.user) process.exit(1);
const b = await admin.auth.admin.createUser({ email: eb, password: "password123", email_confirm: true, user_metadata: { name: "Buyer X" } });
if (b.error) { console.log("createUser B ERR:", b.error.message); process.exit(1); }

const cat = (await admin.from("categories").select("id").limit(1)).data?.[0];
console.log("cat:", cat);

const ins = await admin.from("listings")
  .insert({
    seller_id: a.data.user.id, category_id: cat.id,
    title: "Direct conv probe unit", description: "",
    condition: "baik", normal_price: 1000, area_label: "Bekasi",
    geom: "SRID=4326;POINT(106.9 -6.1)", status: "active",
  })
  .select("id,seller_id");
console.log("insert listing:", ins.error ? `ERR ${JSON.stringify(ins.error)}` : "OK");
const l = ins.data;

await anon.auth.signInWithPassword({ email: eb, password: "password123" });

const r = await anon.from("conversations").insert({
  listing_id: l.id, buyer_id: b.data.user.id, seller_id: l.seller_id,
});
console.log("direct conv insert:", r.error ? `ERR ${r.error.code} ${r.error.message}` : "OK");

console.log(await sql(
  `select polname, polcmd::text as cmd, coalesce(pg_get_expr(polqual,polrelid),'-') as using_expr, coalesce(pg_get_expr(polwithcheck,polrelid),'-') as check_expr
   from pg_policy pol join pg_class c on c.oid = pol.polrelid
   where c.relname = 'conversations'`,
));

// cleanup akun probe
await admin.auth.admin.deleteUser(a.data.user.id);
await admin.auth.admin.deleteUser(b.data.user.id);
