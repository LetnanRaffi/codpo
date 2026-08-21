import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper-soft/50 px-4 py-10">
      <Link
        href="/"
        aria-label="CODPO — ke beranda"
        className="mb-8 flex items-center gap-2.5"
      >
        <Image
          src="/logo-codpo.png"
          alt=""
          width={44}
          height={44}
          priority
          className="size-10 md:size-11"
        />
        <span className="font-display text-3xl font-bold tracking-wide uppercase">
          CODPO
        </span>
      </Link>
      <main className="w-full max-w-sm">{children}</main>
      <p className="mt-6 max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
        Dengan lanjut, kamu setuju jujur di transaksi — barang sesuai deskripsi,
        COD di tempat umum.
      </p>
    </div>
  );
}
