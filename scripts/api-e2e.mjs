/**
 * CODPO Backend End-to-End Test
 * Jalankan: node scripts/api-e2e.mjs  (server harus jalan di :3000/.env.local terisi)
 * Membuat 3 akun nyata via Supabase Auth, menguji seluruh alur + pembuktian RLS
 * lewat HTTP (bukan GUC hack). Output: PASS/FAIL per kasus + ringkasan.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l.slice(l.indexOf("=") + 1).trim(),
    ]),
);
const BASE = process.env.E2E_BASE ?? "http://127.0.0.1:3000";
const stamp = Date.now();

const results = [];
function assert(name, pass, extra = "") {
  results.push({ name, pass });
  console.log(
    `${pass ? "PASS" : "FAIL ***"} — ${name}${extra ? ` (${extra})` : ""}`,
  );
}

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

async function makeUser(name, email) {
  const { data: cu, error: cuErr } = await admin.auth.admin.createUser({
    email,
    password: "password123",
    email_confirm: true,
    user_metadata: { name, phone: "081234567890" },
  });
  if (cuErr) throw new Error(`createUser ${email}: ${cuErr.message}`);
  const sb = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const { error, data } = await sb.auth.signInWithPassword({
    email,
    password: "password123",
  });
  if (error) throw new Error(`signIn ${email}: ${error.message}`);
  const token = data.session.access_token;
  return { id: cu.user.id, sb, token };
}

async function cleanupTestUsers(userIds) {
  if (!userIds.length) return;
  const joined = userIds.join(",");
  const { data: listings, error: listingReadError } = await admin
    .from("listings")
    .select("id")
    .in("seller_id", userIds);
  if (listingReadError) throw listingReadError;
  const listingIds = (listings ?? []).map((row) => row.id);

  const deletes = [
    admin.from("reports").delete().in("reporter_id", userIds),
    ...(listingIds.length
      ? [admin.from("reports").delete().in("target_id", listingIds)]
      : []),
    admin
      .from("transactions")
      .delete()
      .or(`buyer_id.in.(${joined}),seller_id.in.(${joined})`),
    admin
      .from("cod_sessions")
      .delete()
      .or(
        `buyer_id.in.(${joined}),seller_id.in.(${joined}),last_state_actor.in.(${joined})`,
      ),
    admin
      .from("cod_requests")
      .delete()
      .or(`buyer_id.in.(${joined}),seller_id.in.(${joined})`),
    admin.from("listing_boosts").delete().in("seller_id", userIds),
    admin.from("listings").delete().in("seller_id", userIds),
    admin.from("profiles").delete().in("id", userIds),
  ];
  for (const operation of deletes) {
    const { error } = await operation;
    if (error) throw error;
  }
  for (const uid of userIds) {
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) throw error;
  }
}

// ---- helper REST ke API kita dengan JWT user
function api(token) {
  return async function (method, path, body) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try {
      json = await res.json();
    } catch {}
    return { status: res.status, json };
  };
}

let cleanupUsers = [];
let cleanupObjects = [];

try {
  // ===== 0. Buat akun =====
  const A = await makeUser(
    "Seller A",
    `codpo.test.seller.${stamp}@example.com`,
  );
  const B = await makeUser("Buyer B", `codpo.test.buyer.${stamp}@example.com`);
  const C = await makeUser(
    "Outsider C",
    `codpo.test.outsider.${stamp}@example.com`,
  );
  cleanupUsers = [A.id, B.id, C.id];
  const apiA = api(A.token);
  const apiB = api(B.token);
  const apiC = api(C.token);
  console.log(
    `akun siap: A=${A.id.slice(0, 8)} B=${B.id.slice(0, 8)} C=${C.id.slice(0, 8)}\n`,
  );

  const { data: contact } = await admin
    .from("user_contacts")
    .select("phone")
    .eq("user_id", A.id)
    .maybeSingle();
  assert(
    "signup metadata membuat kontak privat",
    contact?.phone === "081234567890",
  );
  const { data: leakedContact } = await B.sb
    .from("user_contacts")
    .select("phone")
    .eq("user_id", A.id);
  assert("RLS: kontak A tidak bocor ke B", (leakedContact ?? []).length === 0);

  // ===== A/E. Listings =====
  let r = await apiA("POST", "/api/listings", {
    title: "iPhone 13 128GB mulus fullset",
    description: "test e2e",
    category_slug: "hp-tablet",
    condition: "seperti_baru",
    normal_price: 6000000,
    bu_price: 4800000,
    bu_expires_at: new Date(Date.now() + 86400000).toISOString(),
    sale_type: "BU",
    cod_available: true,
    area_label: "Bekasi Utara",
    lat: -6.1,
    lng: 106.9,
  });
  assert(
    "A pasang listing BU",
    r.status === 201 && !!r.json?.data?.id,
    r.json?.error,
  );
  const LISTING = r.json.data.id;

  r = await apiA("PATCH", `/api/listings/${LISTING}`, {
    normal_price: 5900000,
  });
  assert("A update harga listing sendiri", r.status === 200);

  r = await apiB("PATCH", `/api/listings/${LISTING}`, { normal_price: 1 });
  assert(
    "RLS: B TIDAK bisa update listing A",
    r.status === 404 || r.status === 403,
  );

  r = await apiB("DELETE", `/api/listings/${LISTING}`);
  assert(
    "RLS: B TIDAK bisa hapus listing A",
    r.status === 404 || r.status === 403,
  );

  // F. Search publik + ranking komponenal
  r = await api(null)(
    "GET",
    `/api/listings?q=iPhone&lat=-6.1&lng=106.9&radius_m=50000`,
  );
  const found = r.json?.data?.items ?? [];
  assert(
    "search publik tanpa login menemukan listing",
    found.some((x) => x.id === LISTING),
  );
  assert(
    "skor komponenal terekspos (PRD §21)",
    !!found.find((x) => x.id === LISTING)?.score?.total,
  );
  const patchedListing = found.find((x) => x.id === LISTING);
  assert(
    "PATCH parsial mempertahankan BU + COD",
    patchedListing?.effective_sale_type === "BU" &&
      patchedListing?.cod_available === true,
  );
  r = await api(null)("GET", `/api/listings/${LISTING}`);
  const viewsBefore = Number(r.json?.data?.listing?.views);
  r = await api(null)("GET", `/api/listings/${LISTING}`);
  const viewsAfter = Number(r.json?.data?.listing?.views);
  assert(
    "view counter bertambah atomik",
    Number.isFinite(viewsBefore) && viewsAfter >= viewsBefore + 1,
    `${viewsBefore}→${viewsAfter}`,
  );

  // Favorit owner-only
  r = await apiB("POST", `/api/favorites/${LISTING}`);
  assert(
    "B menyimpan favorit",
    r.status === 200 && r.json?.data?.favorited === true,
  );
  r = await apiB("GET", "/api/favorites");
  assert(
    "favorit B muncul",
    (r.json?.data?.items ?? []).some((x) => x.listing_id === LISTING),
  );
  r = await apiC("GET", "/api/favorites");
  assert(
    "RLS: favorit B tidak terlihat C",
    !(r.json?.data?.items ?? []).some((x) => x.listing_id === LISTING),
  );
  r = await apiB("DELETE", `/api/favorites/${LISTING}`);
  assert(
    "B menghapus favorit",
    r.status === 200 && r.json?.data?.favorited === false,
  );

  // K. Boost
  r = await apiA("POST", `/api/listings/${LISTING}/boost`, {
    product_code: "boost_24h",
  });
  assert("A beli boost listing sendiri", r.status === 200);
  r = await apiB("POST", `/api/listings/${LISTING}/boost`, {
    product_code: "boost_24h",
  });
  assert("RLS: B boost listing A ditolak", r.status >= 400);

  // ===== D. Presign + upload nyata ke R2 =====
  r = await apiA("POST", "/api/upload/presign", {
    kind: "listing",
    mime: "image/png",
    size: 1000,
    listing_id: LISTING,
  });
  assert("presign URL dibuat", r.status === 200 && !!r.json?.data?.upload_url);
  const pres = r.json.data;
  cleanupObjects.push(pres.key);
  const png1px = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const up = await fetch(pres.upload_url, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: png1px,
  });
  assert(
    "upload langsung ke R2 sukses",
    up.status === 200,
    `HTTP ${up.status}`,
  );
  const { error: imageInsertError } = await A.sb.from("listing_images").insert({
    listing_id: LISTING,
    object_key: pres.key,
    position: 0,
  });
  assert("metadata gambar listing tersimpan", !imageInsertError);
  r = await api(null)("GET", `/api/listings?q=iPhone`);
  const listingWithImage = (r.json?.data?.items ?? []).find(
    (item) => item.id === LISTING,
  );
  assert(
    "hasil pencarian membawa URL foto",
    r.status === 200 && Boolean(listingWithImage?.images?.[0]),
  );
  if (listingWithImage?.images?.[0]) {
    const publicImage = await fetch(BASE + listingWithImage.images[0]);
    assert(
      "media listing dapat dibaca publik lewat signed fallback",
      publicImage.status === 200,
    );
  }
  r = await apiA("POST", "/api/upload/presign", {
    kind: "listing",
    mime: "image/gif",
    size: 100,
    listing_id: LISTING,
  });
  assert("validasi mime: gif ditolak 415", r.status === 415);

  // ===== G. Chat =====
  r = await apiB("POST", "/api/conversations", { listing_id: LISTING });
  assert(
    "B buka conversation listing A",
    r.status === 201 && !!r.json?.data?.conversation_id,
    `HTTP ${r.status} ${JSON.stringify(r.json?.error ?? "")}`,
  );
  if (!r.json?.data?.conversation_id) {
    console.log("\n===== STOP: conversation gagal =====");
    process.exit(1);
  }
  const CONV = r.json.data.conversation_id;

  r = await apiB("POST", `/api/conversations/${CONV}/messages`, {
    type: "text",
    body: "gan ready?",
  });
  assert("B kirim pesan", r.status === 201);

  r = await apiB("POST", "/api/upload/presign", {
    kind: "chat",
    mime: "image/png",
    size: png1px.length,
  });
  const chatImage = r.json?.data;
  assert(
    "B mendapat presign gambar chat",
    r.status === 200 && !!chatImage?.key,
  );
  if (chatImage?.key) {
    cleanupObjects.push(chatImage.key);
    const chatUpload = await fetch(chatImage.upload_url, {
      method: "PUT",
      headers: chatImage.headers,
      body: png1px,
    });
    assert("upload gambar chat ke R2 sukses", chatUpload.status === 200);
    r = await apiC("POST", `/api/conversations/${CONV}/messages`, {
      type: "image",
      body: "milik-b.png",
      media_key: chatImage.key,
    });
    assert("media_key chat user lain ditolak", r.status === 403);
    r = await apiB("POST", `/api/conversations/${CONV}/messages`, {
      type: "image",
      body: "bukti.png",
      media_key: chatImage.key,
    });
    assert("B kirim gambar chat milik sendiri", r.status === 201);
    r = await apiC(
      "GET",
      `/api/media?key=${encodeURIComponent(chatImage.key)}`,
    );
    assert("media chat tertutup untuk outsider", r.status === 404);
    r = await apiB(
      "GET",
      `/api/media?key=${encodeURIComponent(chatImage.key)}`,
    );
    assert("media chat dapat dibaca participant", r.status === 200);
  }

  r = await apiA("GET", "/api/conversations");
  const sellerInbox = (r.json?.data?.items ?? []).find(
    (item) => item.id === CONV,
  );
  assert(
    "pesan baru tampil sebagai unread seller",
    r.status === 200 && sellerInbox?.unread_count >= 1,
  );

  r = await apiC("PATCH", `/api/conversations/${CONV}/read`);
  assert("RLS: C tidak bisa menandai chat A-B dibaca", r.status >= 400);

  r = await apiA("PATCH", `/api/conversations/${CONV}/read`);
  assert("A menandai percakapan dibaca", r.status === 200);
  r = await apiA("GET", "/api/conversations");
  assert(
    "unread seller kembali nol setelah dibaca",
    (r.json?.data?.items ?? []).find((item) => item.id === CONV)
      ?.unread_count === 0,
  );

  r = await apiC("GET", `/api/conversations/${CONV}/messages`);
  assert(
    "RLS: C TIDAK bisa baca chat A-B",
    r.status === 403 || (r.json?.data?.items ?? [1]).length === 0
      ? true
      : false,
  );
  // (endpoint menolak via RLS → items kosong/403)

  r = await apiC("POST", `/api/conversations/${CONV}/messages`, {
    type: "text",
    body: "iwak",
  });
  assert("RLS: C TIDAK bisa kirim pesan ke chat A-B", r.status >= 400);

  r = await apiA("GET", `/api/conversations/${CONV}/messages`);
  assert(
    "A (seller) bisa baca chat",
    r.status === 200 && r.json.data.items.length >= 1,
  );

  // ===== H. COD flow + state machine =====
  r = await apiB("POST", "/api/cod/requests", {
    listing_id: LISTING,
    preferred_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    preferred_time: "15:00",
    meeting_point: "Alun-alun Bekasi",
  });
  assert(
    "B ajukan COD",
    r.status === 201 && !!r.json?.data?.request_id,
    `HTTP ${r.status} ${JSON.stringify(r.json?.error ?? "")}`,
  );
  if (!r.json?.data?.request_id)
    throw new Error(`COD request gagal: ${JSON.stringify(r)}`);
  const REQ = r.json.data.request_id;

  r = await apiB("PATCH", `/api/cod/requests/${REQ}`, { action: "accept" });
  assert("RLS: accept HANYA seller (B ditolak)", r.status >= 400);

  r = await apiA("PATCH", `/api/cod/requests/${REQ}`, { action: "accept" });
  assert(
    "A accept → session+transaction dibuat",
    r.status === 200 && !!r.json?.data?.session_id,
    `HTTP ${r.status} ${JSON.stringify(r.json?.error ?? "")}`,
  );
  if (!r.json?.data?.session_id)
    throw new Error(`accept COD gagal: ${JSON.stringify(r)}`);
  const SESS = r.json.data.session_id;

  r = await apiB("POST", `/api/cod/sessions/${SESS}/state`, {
    state: "completed",
  });
  assert("state machine: loncat accepted→completed DITOLAK", r.status >= 400);

  r = await apiB("POST", `/api/cod/sessions/${SESS}/state`, {
    state: "scheduled",
  });
  assert("transisi valid: accepted→scheduled", r.status === 200);

  // Tracking (PRD §30-31)
  r = await apiB("POST", `/api/cod/sessions/${SESS}/location`, {
    lat: -6.1,
    lng: 106.9,
  });
  assert("tracking sebelum sharing aktif DITOLAK", r.status >= 400);

  r = await apiB("PATCH", `/api/cod/sessions/${SESS}/location`, {
    enabled: true,
  });
  assert("opt-in sharing lokasi", r.status === 200);

  r = await apiB("POST", `/api/cod/sessions/${SESS}/location`, {
    lat: -6.1,
    lng: 106.9,
  });
  assert("tracking saat belum OTW DITOLAK", r.status >= 400);

  r = await apiB("POST", `/api/cod/sessions/${SESS}/state`, { state: "otw" });
  assert("transisi valid: scheduled→otw", r.status === 200);

  r = await apiB("POST", `/api/cod/sessions/${SESS}/location`, {
    lat: -6.1,
    lng: 106.9,
    accuracy_m: 10,
  });
  assert(
    "titik GPS pertama tersimpan",
    r.status === 200 && r.json?.data?.status === "stored",
  );

  r = await apiB("POST", `/api/cod/sessions/${SESS}/location`, {
    lat: -6.10001,
    lng: 106.9,
  });
  assert(
    "throttle <30s/<50m → throttled",
    r.json?.data?.status === "throttled",
  );

  r = await apiA("POST", `/api/cod/sessions/${SESS}/location`, {
    lat: -6.11,
    lng: 106.9,
  });
  assert("GPS seller juga tersimpan", r.json?.data?.status === "stored");

  r = await apiC("GET", `/api/cod/sessions/${SESS}`);
  assert(
    "RLS: C TIDAK bisa lihat sesi COD orang lain",
    r.status === 404 || r.status === 403,
  );

  // Completion
  r = await apiA("POST", `/api/cod/sessions/${SESS}/state`, {
    state: "item_check",
  });
  assert("state machine: item_check HANYA buyer", r.status >= 400);

  r = await apiA("POST", `/api/cod/sessions/${SESS}/state`, {
    state: "arrived",
  });
  assert("transisi valid: near/otw→arrived (seller)", r.status === 200);

  r = await apiB("POST", `/api/cod/sessions/${SESS}/state`, {
    state: "item_check",
  });
  assert("buyer konfirmasi item_check", r.status === 200);

  r = await apiB("POST", `/api/cod/sessions/${SESS}/state`, {
    state: "completed",
  });
  assert("buyer selesaikan transaksi", r.status === 200);

  r = await apiB("GET", "/api/transactions");
  const trx = (r.json?.data?.items ?? []).find((t) => t.listing_id === LISTING);
  assert("transaction otomatis COMPLETED", trx?.status === "completed");

  r = await apiA("GET", `/api/listings/${LISTING}`);
  assert(
    "listing otomatis SOLD setelah COD selesai",
    r.json?.data?.listing?.status === "sold",
  );
  const { data: soldForBuyer } = await B.sb
    .from("listings")
    .select("id,status")
    .eq("id", LISTING)
    .maybeSingle();
  assert(
    "buyer transaksi tetap bisa melihat listing sold",
    soldForBuyer?.status === "sold",
  );
  const { data: soldImagesForBuyer } = await B.sb
    .from("listing_images")
    .select("object_key")
    .eq("listing_id", LISTING);
  assert(
    "buyer transaksi tetap bisa melihat foto listing sold",
    (soldImagesForBuyer ?? []).length === 1,
  );
  const { data: soldForOutsider } = await C.sb
    .from("listings")
    .select("id")
    .eq("id", LISTING);
  assert(
    "RLS: outsider tidak bisa melihat listing sold",
    (soldForOutsider ?? []).length === 0,
  );

  // ===== I. Reviews =====
  r = await apiB("POST", "/api/reviews", {
    transaction_id: trx.id,
    rating: 5,
    body: "mulus",
  });
  assert("B review A (5 stars)", r.status === 201);

  r = await apiB("POST", "/api/reviews", { transaction_id: trx.id, rating: 1 });
  assert("duplicate review DITOLAK (409)", r.status === 409);

  r = await apiA("POST", "/api/reviews", { transaction_id: trx.id, rating: 4 });
  assert("A review balas ke B", r.status === 201);

  r = await apiC("POST", "/api/reviews", { transaction_id: trx.id, rating: 1 });
  assert("RLS: non-participant review DITOLAK", r.status >= 400);

  // ===== L. Notifications =====
  r = await apiA("GET", "/api/notifications");
  assert(
    "notifikasi seller masuk (chat/COD/completed)",
    (r.json?.data?.items ?? []).length >= 3,
    `count=${r.json?.data?.items?.length}`,
  );

  // ===== J. Reports + Admin =====
  r = await apiB("POST", "/api/reports", {
    target_type: "listing",
    target_id: LISTING,
    reason: "fake_item",
  });
  assert("B lapor listing", r.status === 201);

  r = await apiA("GET", "/api/admin/analytics");
  assert("RLS/admin: non-admin ditolak 403", r.status === 403);

  // Promote C sebagai admin via service role (simulasi seed manual)
  await admin.from("admin_users").insert({ user_id: C.id });
  r = await apiC("GET", "/api/admin/analytics");
  assert(
    "admin bisa akses analytics",
    r.status === 200 && !!r.json?.data?.users,
  );

  r = await apiC("PATCH", `/api/admin/listings/${LISTING}`, {
    action: "remove",
    note: "tes moderasi",
  });
  assert("admin remove listing + audit", r.status === 200);

  r = await apiC("GET", "/api/admin/users/" + A.id);
  assert("admin view user", r.status === 200 && !!r.json?.data?.profile);

  r = await apiC("PATCH", `/api/admin/users/${A.id}`, {
    action: "suspend",
    note: "tes",
  });
  assert("admin suspend user", r.status === 200);

  r = await apiA("POST", "/api/listings", {
    title: "suspend tidak bisa posting ya",
    description: "x",
    category_slug: "lainnya",
    condition: "baik",
    normal_price: 1000,
    area_label: "X",
    lat: -6,
    lng: 106,
  });
  assert("user suspended TIDAK bisa pasang listing", r.status === 403);

  r = await apiC("PATCH", `/api/admin/users/${A.id}`, { action: "restore" });
  assert("admin restore user", r.status === 200);
} finally {
  for (const key of cleanupObjects) {
    await r2
      .send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }))
      .catch(() => {});
  }
  await cleanupTestUsers(cleanupUsers);
}

const pass = results.filter((r) => r.pass).length;
const fail = results.filter((r) => !r.pass).length;
console.log(`\n===== HASIL: ${pass} PASSED, ${fail} FAILED =====`);
if (fail) {
  console.log(
    "Gagal:",
    results
      .filter((r) => !r.pass)
      .map((r) => r.name)
      .join(" | "),
  );
  process.exit(1);
}
