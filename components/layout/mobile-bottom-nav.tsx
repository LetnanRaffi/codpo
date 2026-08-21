"use client";

import { House, Plus, ReceiptText, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/search", label: "Cari", icon: Search },
  { href: "/sell", label: "Jual", icon: Plus, primary: true },
  { href: "/transactions", label: "Transaksi", icon: ReceiptText },
  { href: "/profile", label: "Profil", icon: UserRound },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon, ...item }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const primary = "primary" in item && item.primary;

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {primary ? (
                <span
                  className={cn(
                    "-mt-5 flex size-11 items-center justify-center rounded-full border-4 border-background bg-bu-red text-white shadow-lg shadow-bu-red/30 transition-colors active:bg-bu-red-deep",
                    active && "bg-bu-red-deep",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
              ) : (
                <Icon className="size-5" aria-hidden />
              )}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
