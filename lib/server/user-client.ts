import { createBrowserClient } from "@supabase/ssr";

/**
 * Client terikat JWT pemanggil → query SELECT menghormati RLS sebagai user tsb
 * (defense-in-depth: service-role hanya untuk operasi yang memang butuh bypass,
 * dan selalu SETELAH cek otorisasi eksplisit).
 */
export function userClient(req: Request) {
  const token = bearer(req);
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      cookies: {
        getAll: () => [],
        setAll: () => undefined,
      },
    },
  );
}

export function bearer(req: Request): string | null {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;
}
