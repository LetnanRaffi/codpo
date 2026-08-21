import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { ListingGrid } from "@/components/listing/listing-card";
import { CATEGORIES, MOCK_LISTINGS } from "@/lib/mock/data";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  return { title: category ? category.name : "Kategori" };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  const listings = MOCK_LISTINGS.filter(
    (l) => l.category_slug === slug && l.status === "active",
  );

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-foreground">
            {category.name}
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">
          {category.name}
        </h1>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {listings.length} barang
        </p>
      </div>

      {listings.length > 0 ? (
        <ListingGrid listings={listings} />
      ) : (
        <EmptyState
          title={`Belum ada barang di ${category.name}`}
          description="Jadi yang pertama jualan di kategori ini — listingmu tampil paling atas."
          actionLabel="Pasang Listing"
          actionHref="/sell"
        />
      )}
    </div>
  );
}
