import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ApiError, handleError, ok } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { r2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Upload server-side untuk menghindari CORS R2 pada browser/Vercel preview. */
export async function POST(req: Request) {
  try {
    rateLimit(req, "upload-proxy", 30, 60 * 1000);
    const user = await requireUser(req);
    const form = await req.formData();
    const file = form.get("file");
    const listingId = String(form.get("listing_id") ?? "");
    if (!(file instanceof File) || !listingId) throw new ApiError(422, "file dan listing_id wajib");
    if (!EXT[file.type]) throw new ApiError(415, "format foto harus JPG, PNG, atau WebP");
    if (file.size > 4 * 1024 * 1024) throw new ApiError(413, "ukuran foto maksimal 4 MB");
    const db = (await import("@/lib/server/user-client")).userClient(req);
    const [{ data: owned }, { count }] = await Promise.all([
      db.from("listings").select("id").eq("id", listingId).eq("seller_id", user.id).maybeSingle(),
      db.from("listing_images").select("id", { count: "exact", head: true }).eq("listing_id", listingId),
    ]);
    if (!owned) throw new ApiError(403, "bukan listing milikmu");
    if ((count ?? 0) >= 10) throw new ApiError(409, "maksimal 10 gambar per listing");
    const key = `listings/${listingId}/${crypto.randomUUID()}.${EXT[file.type]}`;
    await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key, ContentType: file.type, Body: Buffer.from(await file.arrayBuffer()) }));
    const admin = createAdminClient();
    const { error } = await admin.from("listing_images").insert({ listing_id: listingId, object_key: key, position: count ?? 0 });
    if (error) throw error;
    return ok({ key });
  } catch (e) { return handleError(e); }
}
