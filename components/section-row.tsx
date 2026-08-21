import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function SectionRow({
  title,
  seeAllHref,
  children,
  className,
}: {
  title: string;
  seeAllHref?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-bold tracking-wide uppercase">
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="inline-flex shrink-0 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Lihat semua
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      <div className="flex [scrollbar-width:none] gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}
