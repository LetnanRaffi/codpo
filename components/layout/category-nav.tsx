"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

function CategoryLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
        active
          ? "bg-secondary font-semibold text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function CategoryNav() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    void createClient()
      .from("categories")
      .select("id,slug,name")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  return (
    <nav
      aria-label="Kategori"
      className="hidden border-b bg-background md:block"
    >
      <div className="mx-auto flex w-full max-w-7xl [scrollbar-width:none] items-center gap-1 overflow-x-auto px-4 py-2 [&::-webkit-scrollbar]:hidden">
        <CategoryLink href="/" active={pathname === "/"}>
          Semua
        </CategoryLink>
        {categories.map((category) => (
          <CategoryLink
            key={category.slug}
            href={`/category/${category.slug}`}
            active={pathname === `/category/${category.slug}`}
          >
            {category.name}
          </CategoryLink>
        ))}
      </div>
    </nav>
  );
}
