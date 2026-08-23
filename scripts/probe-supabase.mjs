import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Daftar tabel yang terekspos REST saat ini
const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
const spec = await res.json();
console.log("tabel ekspos REST sekarang:", Object.keys(spec.definitions ?? {}).join(", ") || "(kosong)");

// Signup pakai example.com
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error, data } = await anon.auth.signUp({
  email: `probe-${Date.now()}@example.com`,
  password: "password123",
});
console.log("signup example.com:", error ? `ERR ${error.message}` : "OK");
if (data.user) {
  console.log("  session langsung?", !!data.session, "| id:", data.user.id);
  await admin.auth.admin.deleteUser(data.user.id);
  console.log("  probe user dihapus (cleanup)");
}
