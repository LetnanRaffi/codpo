import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ApiError, handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { presignSchema } from "@/lib/server/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { r2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * POST /api/upload/presign — presigned PUT URL untuk upload LANGSUNG client→R2
 * (server tidak memproksi binary, PRD §17/§47).
 *
 * Kompresi/thumbnail: diputuskan CLIENT-SIDE sebelum upload (browser canvas /
 * image-compression lib saat integrasi frontend) — server cuma validasi mime+size.
 * Keputusan ini dilaporkan di docs/backend-decisions.md (bagian D).
 */
export async function POST(req: Request) {
  try {
    rateLimit(req, "presign", 30, 60 * 1000);
    const user = await requireUser(req);
    const body = await parseBody(req, presignSchema);

    // Konfigurasi dari DB (bukan hardcode) — admin bisa ubah tanpa deploy.
    const admin = createAdminClient();
    const { data: cfgRow } = await admin
      .from("app_config")
      .select("value")
      .eq("key", "uploads")
      .single();
    const cfg = {
      maxImageBytes: Number(cfgRow?.value?.max_image_bytes ?? 5 * 1024 * 1024),
      allowedMimes:
        (cfgRow?.value?.allowed_mimes as string[]) ?? Object.keys(EXT),
      maxImagesPerListing: Number(cfgRow?.value?.max_images_per_listing ?? 10),
    };

    if (!cfg.allowedMimes.includes(body.mime)) {
      throw new ApiError(415, `tipe file ${body.mime} tidak diizinkan`);
    }
    if (body.size > cfg.maxImageBytes) {
      throw new ApiError(
        413,
        `ukuran maksimal ${Math.floor(cfg.maxImageBytes / 1024 / 1024)}MB`,
      );
    }

    const ext = EXT[body.mime];
    let key: string;

    if (body.kind === "listing") {
      if (!body.listing_id)
        throw new ApiError(422, "listing_id wajib untuk foto listing");
      const db = await import("@/lib/server/user-client").then((m) =>
        m.userClient(req),
      );
      const [{ data: owned }, { count }] = await Promise.all([
        db
          .from("listings")
          .select("id")
          .eq("id", body.listing_id)
          .maybeSingle(),
        db
          .from("listing_images")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", body.listing_id),
      ]);
      if (!owned) throw new ApiError(403, "bukan listing milikmu");
      if ((count ?? 0) >= cfg.maxImagesPerListing) {
        throw new ApiError(
          409,
          `maksimal ${cfg.maxImagesPerListing} gambar per listing`,
        );
      }
      key = `listings/${body.listing_id}/${crypto.randomUUID()}.${ext}`;
    } else {
      key = `chats/${user.id}/${crypto.randomUUID()}.${ext}`;
    }

    const url = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        ContentType: body.mime,
      }),
      { expiresIn: 300 },
    );

    return ok({
      key,
      upload_url: url,
      method: "PUT",
      headers: { "Content-Type": body.mime },
      expires_in: 300,
    });
  } catch (e) {
    return handleError(e);
  }
}

// GetObjectCommand diimpor agar tipe terpakai bila nanti perlu signed GET privat.
