"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/boost", label: "Boost" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-1">
      {NAV.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`block shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                active
                  ? "bg-secondary font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
