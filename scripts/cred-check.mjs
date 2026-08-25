// Smoke kredensial: Supabase REST/service_role + R2 round-trip.
// Usage: node scripts/cred-check.mjs  (baca .env.local manual, tanpa dep dotenv)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l.slice(l.indexOf("=") + 1).trim(),
    ]),
);

console.log("== Supabase ==");
const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);
const { error: profErr } = await admin.from("profiles").select("id").limit(1);
console.log(
  "service_role → profiles:",
  profErr ? `ERR ${profErr.message}` : "OK (tabel ada)",
);
if (profErr?.message?.includes("does not exist"))
  console.log(
    "→ schema BELUM di-push (dugaan benar, butuh DB password untuk DDL)",
  );
if (profErr) throw profErr;

const anon = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const { error: anonErr } = await anon.from("categories").select("id").limit(1);
console.log(
  "anon → categories:",
  anonErr ? `ERR ${anonErr.message}` : "OK (anon key + RLS siap)",
);
if (anonErr) throw anonErr;

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
await r2.send(
  new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key,
    Body: "codpo cred check",
    ContentType: "text/plain",
  }),
);
console.log(`PUT ${env.R2_BUCKET}/${Key}: OK`);
const head = await r2.send(
  new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key }),
);
console.log("HEAD:", head.ContentLength, "bytes OK");
await r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key }));
console.log("DELETE cleanup: OK");
