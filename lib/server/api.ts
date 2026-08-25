import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Parse + validasi Zod server-side (PRD §45 — jangan percaya validasi frontend). */
export async function parseBody<T>(
  req: Request,
  schema: {
    safeParse: (
      v: unknown,
    ) =>
      | { success: true; data: T }
      | { success: false; error: { issues: { message: string }[] } };
  },
): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "body harus JSON valid");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(
      422,
      parsed.error.issues[0]?.message ?? "payload tidak valid",
    );
  }
  return parsed.data;
}

type PgLikeError = { code?: string; message?: string; status?: number };

export function handleError(e: unknown) {
  if (e instanceof ApiError) return fail(e.status, e.message);

  const err = e as PgLikeError;
  const raw = String(err?.message ?? e ?? "kesalahan server");
  console.error(
    "[api-debug]",
    JSON.stringify({
      code: err?.code,
      message: raw.slice(0, 300),
      hint: (err as { details?: string; hint?: string }).hint ?? "",
    }),
  );

  if ((err as { status?: number }).status === 429)
    return fail(429, "terlalu banyak request — coba lagi nanti");

  // Postgres → HTTP mapping
  switch (err?.code) {
    case "23505":
      return fail(409, "data sudah ada (duplikat)");
    case "23514":
      return fail(422, "data melanggar aturan");
    case "42501": // RLS / permission
      return fail(403, "kamu tidak punya akses ke resource ini");
    case "PGRST116":
      return fail(404, "tidak ditemukan");
  }

  // Pesan bisnis dari RPC/trigger kita → 4xx dengan pesan asli
  if (
    /tidak ditemukan|tidak valid|tidak bisa|hanya |bukan milik|belum diaktifkan|tracking tidak aktif|maksimal|masih |sudah |harus |gagal/i.test(
      raw,
    )
  ) {
    return fail(400, raw);
  }

  console.error("[api]", e);
  return fail(500, "kesalahan server internal");
}
