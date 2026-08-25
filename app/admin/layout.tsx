import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/server/admin-page";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return (
    <div className="min-h-dvh">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4">
          <Link
            href="/admin"
            className="flex items-center gap-2"
            aria-label="CODPO Admin"
          >
            <Image
              src="/logo-codpo.png"
              alt=""
              width={28}
              height={28}
              className="size-7"
            />
            <span className="font-display text-lg font-bold tracking-wide uppercase">
              CODPO
            </span>
          </Link>
          <Badge
            variant="secondary"
            className="rounded-full font-mono text-[10px] tracking-wider uppercase"
          >
            Admin
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto rounded-full"
            asChild
          >
            <Link href="/">
              Ke marketplace <ExternalLink aria-hidden />
            </Link>
          </Button>
        </div>
        <nav
          aria-label="Navigasi admin"
          className="mx-auto w-full max-w-7xl [scrollbar-width:none] overflow-x-auto px-4 pb-2 [&::-webkit-scrollbar]:hidden"
        >
          <AdminNav />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
