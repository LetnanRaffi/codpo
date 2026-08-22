import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-paper-soft/50">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-codpo.png"
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
          <span className="font-display text-base font-bold tracking-wide uppercase">
            CODPO
          </span>
        </div>

        <nav aria-label="Legal" className="flex items-center gap-5 text-sm">
          <Link
            href="/terms"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Syarat &amp; Ketentuan
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Kebijakan Privasi
          </Link>
        </nav>

        <p className="font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()} CODPO — barang murah, COD langsung.
        </p>
      </div>
    </footer>
  );
}
