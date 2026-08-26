import { ApiError } from "@/lib/server/api";
import { bearer } from "@/lib/server/user-client";
import { createAdminClient } from "@/lib/supabase/admin";

/** Verifikasi Bearer token Supabase → user. Semua mutating endpoint wajib ini. */
export async function requireUser(req: Request) {
  const token = bearer(req);
  if (!token) throw new ApiError(401, "header Authorization Bearer wajib");
  const {
    data: { user },
    error,
  } = await createAdminClient().auth.getUser(token);
  if (error || !user) throw new ApiError(401, "token tidak valid/kedaluwarsa");

  // Akun suspended/banned gak boleh pakai API tulis (PRD §38).
  const { data: profile, error: profileError } = await createAdminClient()
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();
  if (profileError) throw profileError;
  if (!profile) throw new ApiError(403, "profil akun belum siap");
  if (profile.status !== "active") {
    throw new ApiError(
      403,
      profile.status === "suspended"
        ? "akun kamu di-suspend — hubungi support"
        : "akun kamu diblokir",
    );
  }
  return user;
}

export async function optionalUser(req: Request) {
  if (!bearer(req)) return null;
  try {
    return await requireUser(req);
  } catch {
    return null;
  }
}

export async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  const { data } = await createAdminClient()
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw new ApiError(403, "endpoint khusus admin");
  return user;
}

/** Tulis audit trail (PRD §43/J). Panggil setelah mutasi admin sukses. */
export async function writeAudit(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  detail: Record<string, unknown> = {},
) {
  const { error } = await createAdminClient().from("admin_actions").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    detail,
  });
  if (error) throw error;
}
