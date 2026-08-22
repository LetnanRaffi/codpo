import Image from "next/image";
import Link from "next/link";

const EXPLORE = [
  { href: "/", label: "Home" },
  { href: "/#kategori", label: "Kategori" },
  { href: "/search?bu=1", label: "BU Terdekat" },
];

const ACCOUNT = [
  { href: "/login", label: "Masuk" },
  { href: "/register", label: "Daftar" },
  { href: "/sell", label: "Jual Barang" },
  { href: "/seller/dashboard", label: "Dashboard Seller" },
];

const LEGAL = [
  { href: "/terms", label: "Syarat & Ketentuan" },
  { href: "/privacy", label: "Kebijakan Privasi" },
];

// Disembunyikan sampai halamannya ada — dilarang link mati:
// Pusat Bantuan/FAQ, Hubungi Kami, Cara Kerja COD, akun media sosial.

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <nav aria-label={title} className={className}>
      <p className="text-xs font-semibold tracking-wider text-paper-soft/60 uppercase">
        {title}
      </p>
      <ul className="mt-3.5 space-y-2.5">
        {links.map(({ href, label }) => (
          <li key={label}>
            <Link
              href={href}
              className="text-sm text-paper-soft/75 transition-colors hover:text-bu-red"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper-soft">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14">
        <div className="grid gap-9 sm:grid-cols-2 md:grid-cols-12 md:gap-6">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-5 lg:col-span-4">
            <Link
              href="/"
              aria-label="CODPO — ke beranda"
              className="flex items-center gap-2.5"
            >
              <Image
                src="/logo-codpo.png"
                alt=""
                width={32}
                height={32}
                className="size-8"
              />
              <span className="font-display text-xl font-bold tracking-wide uppercase">
                CODPO
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper-soft/70">
              Marketplace lokal untuk barang BU — cepat, dekat, COD langsung.
            </p>
          </div>

          <FooterColumn
            title="Jelajahi"
            links={EXPLORE}
            className="md:col-span-2"
          />
          <FooterColumn
            title="Akun"
            links={ACCOUNT}
            className="md:col-span-2"
          />
          <FooterColumn
            title="Bantuan & Legal"
            links={LEGAL}
            className="md:col-span-3 lg:col-span-2"
          />
        </div>

        {/* Bottom bar */}
        <div className="mt-11 flex flex-col gap-1.5 border-t border-paper-soft/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-paper-soft/55">
            © {year} CODPO. Semua hak dilindungi.
          </p>
          <p className="font-mono text-xs text-paper-soft/45">
            Dibuat di Indonesia 🇮🇩
          </p>
        </div>
      </div>
    </footer>
  );
}
