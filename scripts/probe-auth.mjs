import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l.slice(l.indexOf("=") + 1).trim(),
    ]),
);

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);
const anon = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const stamp = Date.now();

for (const email of [
  `probe${stamp}@example.com`,
  `codpo.test.${stamp}@gmail.com`,
]) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "password123",
    email_confirm: true,
    user_metadata: { name: "Probe" },
  });
  console.log(
    `admin.createUser ${email}:`,
    error ? `ERR ${error.message}` : `OK id=${data.user.id}`,
  );
  if (data.user) {
    const { error: loginErr } = await anon.auth.signInWithPassword({
      email,
      password: "password123",
    });
    console.log(
      "  signInWithPassword:",
      loginErr ? `ERR ${loginErr.message}` : "OK dapat session",
    );
    await admin.auth.admin.deleteUser(data.user.id);
  }
}
