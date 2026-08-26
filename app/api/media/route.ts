import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { fail } from "@/lib/server/api";
import { bearer, userClient } from "@/lib/server/user-client";
import { r2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const LISTING_KEY = /^listings\/[a-f0-9-]{36}\/[a-zA-Z0-9._-]{8,120}$/;
const CHAT_KEY = /^chats\/[a-f0-9-]{36}\/[a-zA-Z0-9._-]{8,120}$/;

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const listingMedia = LISTING_KEY.test(key);
  const chatMedia = CHAT_KEY.test(key);
  if (!listingMedia && !chatMedia) return fail(400, "media key tidak valid");

  const db = bearer(req) ? userClient(req) : await createClient();
  if (listingMedia) {
    const { data, error } = await db
      .from("listing_images")
      .select("id")
      .eq("object_key", key)
      .maybeSingle();
    if (error || !data) return fail(404, "media tidak ditemukan");
  } else {
    const { data, error } = await db
      .from("messages")
      .select("id")
      .eq("media_key", key)
      .maybeSingle();
    if (error || !data) return fail(404, "media tidak ditemukan");
  }

  try {
    const signed = await getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }),
      { expiresIn: 300 },
    );
    const response = NextResponse.redirect(signed, 307);
    response.headers.set(
      "Cache-Control",
      listingMedia ? "public, max-age=240" : "private, no-store",
    );
    return response;
  } catch (error) {
    console.error("[media.sign]", error);
    return fail(502, "media sementara tidak tersedia");
  }
}
