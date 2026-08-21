import { CategoryNav } from "@/components/layout/category-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteHeader } from "@/components/layout/site-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <CategoryNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-24 md:pt-6 md:pb-10">
        {children}
      </main>
      <MobileBottomNav />
    </>
  );
}
