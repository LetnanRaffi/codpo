/** Hanya izinkan path lokal. Menolak URL absolut dan protocol-relative. */
export function safeLocalPath(
  value: string | null | undefined,
  fallback = "/",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  try {
    const parsed = new URL(value, "https://codpo.local");
    return parsed.origin === "https://codpo.local"
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
