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

const { data: l } = await admin
  .from("listings")
  .select("id,seller_id,status")
  .limit(1)
  .maybeSingle();
console.log("listing:", JSON.stringify(l));

// B = buyer dari sesi e2e terakhir
const B_ID = "db8b7a12-7b86-4168-a10a-719db425dc0a";
await admin.auth.admin.updateUserById(B_ID, { password: "password123" });

const ld = await anon.auth.signInWithPassword({
  email: (await admin.auth.admin.getUserById(B_ID)).data.user.email,
  password: "password123",
});
const tok = ld.data.session.access_token;
console.log("login OK sebagai", ld.data.user.id);

const res = await fetch(
  env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/conversations",
  {
    method: "POST",
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${tok}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      listing_id: l.id,
      buyer_id: ld.data.user.id,
      seller_id: l.seller_id,
    }),
  },
);
console.log("REST insert:", res.status, (await res.text()).slice(0, 200));
