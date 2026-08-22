import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4">
          <Link
            href="/"
            aria-label="CODPO — kembali ke beranda"
            className="flex items-center gap-2"
          >
            <Image
              src="/logo-codpo.png"
              alt=""
              width={32}
              height={32}
              className="size-8"
              priority
            />
            <span className="font-display text-xl font-bold tracking-wide uppercase">
              CODPO
            </span>
          </Link>
        </div>
      </header>

      {/* Kolom teks dibatasi biar nyaman dibaca, gak full-width di desktop */}
      <main className="mx-auto w-full max-w-[68ch] flex-1 px-4 py-10 md:py-14">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
