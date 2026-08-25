import { createClient } from "@/lib/supabase/client";

type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: string };

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (session?.access_token)
    headers.set("Authorization", `Bearer ${session.access_token}`);

  const response = await fetch(path, { ...init, headers });
  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload && "error" in payload
        ? payload.error
        : `Request gagal (${response.status})`,
    );
  }
  return payload.data;
}
