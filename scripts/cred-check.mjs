// Smoke kredensial: Supabase REST/service_role + R2 round-trip.
// Usage: node scripts/cred-check.mjs  (baca .env.local manual, tanpa dep dotenv)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const mask = (s) => `${String(s).slice(0, 8)}…`;

console.log("== Supabase ==");
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { error: profErr } = await admin.from("profiles").select("id").limit(1);
console.log("service_role → profiles:", profErr ? `ERR ${profErr.message}` : "OK (tabel ada)");
if (profErr?.message?.includes("does not exist"))
  console.log("→ schema BELUM di-push (dugaan benar, butuh DB password untuk DDL)");

const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error: signupErr, data: su } = await anon.auth.signUp({
  email: `probe-${Date.now()}@test.local`,
  password: "password123",
});
console.log(
  "anon signup probe:",
  signupErr ? `ERR ${signupErr.message}` : `OK user=${su.user.id} (confirmed=${!!su.session})`,
);
if (su.user) await admin.auth.admin.deleteUser(su.user.id); // bersihkan probe

console.log("\n== Cloudflare R2 ==");
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});
const Key = `__credcheck/${crypto.randomUUID()}.txt`;
await r2.send(new PutObjectCommand({ Bucket: env.R2_BUCKET, Key, Body: "codpo cred check", ContentType: "text/plain" }));
console.log(`PUT ${env.R2_BUCKET}/${Key}: OK`);
const head = await r2.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key }));
console.log("HEAD:", head.ContentLength, "bytes OK");
await r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key }));
console.log("DELETE cleanup: OK");
