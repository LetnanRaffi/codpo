export default function HomePage() {
  return (
    <section className="flex flex-col items-start gap-3 py-16">
      <h1 className="font-display text-4xl font-bold tracking-wide uppercase md:text-5xl">
        Shell siap
      </h1>
      <p className="max-w-md leading-relaxed text-muted-foreground">
        Header, kategori nav, bottom nav, tema, dan mock auth sudah terpasang.
        Konten discovery (BU Terdekat, Baru Ditambahkan, dll) masuk di Fase 2.
      </p>
    </section>
  );
}
