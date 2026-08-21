"use client";

import { CheckCircle2, Flame, ImagePlus, MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONDITION_LABELS } from "@/lib/listing";
import { CATEGORIES } from "@/lib/mock/data";
import type { Condition } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 5;

const BU_DURATIONS = [
  { value: "24h", label: "24 jam" },
  { value: "3d", label: "3 hari" },
  { value: "7d", label: "7 hari" },
] as const;

function chip(active: boolean) {
  return cn(
    "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
    active ? "border-foreground bg-secondary font-semibold" : "hover:bg-accent",
  );
}

export function SellForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<{ url: string; name: string }[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [condition, setCondition] = useState<Condition | "">("");
  const [price, setPrice] = useState("");
  const [saleType, setSaleType] = useState<"NORMAL" | "BU">("NORMAL");
  const [buPrice, setBuPrice] = useState("");
  const [buDuration, setBuDuration] = useState<string>("24h");
  const [codAvailable, setCodAvailable] = useState(true);
  const [area, setArea] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const next = Array.from(files)
      .slice(0, room)
      .map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setPhotos((p) => [...p, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(url: string) {
    URL.revokeObjectURL(url);
    setPhotos((p) => p.filter((x) => x.url !== url));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (photos.length === 0) {
      setError("Minimal 1 foto barang.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // UI-only: belum ada upload/backend — preview object URL dibuang di sini
    for (const p of photos) URL.revokeObjectURL(p.url);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
        <CheckCircle2 className="size-10 text-trust-green" aria-hidden />
        <p className="font-display text-2xl font-bold tracking-wide uppercase">
          Listing siap tayang
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Ini demo frontend — data belum kesimpen ke mana-mana. Begitu backend
          nyala, listing ini langsung masuk feed.
        </p>
        <div className="mt-2 flex gap-2">
          <Button className="rounded-full" onClick={() => router.push("/")}>
            Lihat beranda
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setSubmitted(false);
              setPhotos([]);
              setTitle("");
              setDescription("");
              setCategorySlug("");
              setCondition("");
              setPrice("");
              setBuPrice("");
              setArea("");
            }}
          >
            Pasang lagi
          </Button>
        </div>
      </div>
    );
  }

  const buEffective =
    saleType === "BU" && Number(buPrice) > 0 ? Number(buPrice) : null;

  return (
    <form className="space-y-8" onSubmit={handleSubmit} noValidate={false}>
      {/* Foto */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold">
          Foto barang{" "}
          <span className="font-mono text-xs font-normal text-muted-foreground">
            {photos.length}/{MAX_PHOTOS}
          </span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div
              key={p.url}
              className="group relative size-20 overflow-hidden rounded-lg border bg-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={`Preview ${p.name}`}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(p.url)}
                aria-label={`Hapus foto ${p.name}`}
                className="absolute top-1 right-1 rounded-full bg-background/90 p-1 shadow transition-colors hover:bg-bu-red hover:text-white"
              >
                <X className="size-3" aria-hidden />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-accent"
              aria-label="Tambah foto"
            >
              <ImagePlus className="size-5" aria-hidden />
              <span className="text-[10px]">Tambah</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addPhotos(e.target.files)}
        />
      </section>

      {/* Info barang */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sell-title">Judul</Label>
          <Input
            id="sell-title"
            required
            maxLength={70}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: iPhone 13 128GB mulus fullset"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sell-desc">Deskripsi</Label>
          <Textarea
            id="sell-desc"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kondisi detail, kelengkapan, alasan jual…"
            className="rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Kategori</Label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategorySlug(c.slug)}
                className={chip(categorySlug === c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Kondisi</Label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CONDITION_LABELS) as Condition[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                className={chip(condition === c)}
              >
                {CONDITION_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Harga + BU */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sell-price">Harga normal</Label>
          <div className="relative">
            <span className="absolute top-1/2 left-4 -translate-y-1/2 font-mono text-sm text-muted-foreground">
              Rp
            </span>
            <Input
              id="sell-price"
              required
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="rounded-lg pl-11 font-mono"
            />
          </div>
        </div>

        {/* Sale type segmented */}
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
          <button
            type="button"
            onClick={() => setSaleType("NORMAL")}
            aria-pressed={saleType === "NORMAL"}
            className={cn(
              "py-3 text-sm font-bold transition-colors",
              saleType === "NORMAL"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setSaleType("BU")}
            aria-pressed={saleType === "BU"}
            className={cn(
              "flex items-center justify-center gap-1.5 py-3 text-sm font-bold transition-colors",
              saleType === "BU"
                ? "bg-bu-red text-white"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            <Flame className="size-4" aria-hidden /> BU — Butuh Uang
          </button>
        </div>

        {saleType === "BU" && (
          <div className="space-y-4 rounded-xl border border-bu-red/30 bg-bu-red/5 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="sell-bu-price">
                Harga BU{" "}
                <span className="font-normal text-muted-foreground">
                  (lebih murah dari harga normal biar meyakinkan)
                </span>
              </Label>
              <div className="relative max-w-xs">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="sell-bu-price"
                  inputMode="numeric"
                  value={buPrice}
                  onChange={(e) =>
                    setBuPrice(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder={price ? `di bawah ${price}` : "0"}
                  className="rounded-lg pl-11 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">BU berakhir dalam</Label>
              <div className="flex flex-wrap gap-1.5">
                {BU_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setBuDuration(d.value)}
                    className={chip(buDuration === d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Habis masa BU, listing balik normal — gak ikut kehapus.
              </p>
            </div>
            {buEffective !== null && Number(price) > 0 && (
              <p className="font-mono text-xs text-muted-foreground">
                Preview:{" "}
                <span className="line-through">
                  {Number(price).toLocaleString("id-ID")}
                </span>{" "}
                →{" "}
                <span className="font-bold text-bu-red">
                  {buEffective.toLocaleString("id-ID")}
                </span>
              </p>
            )}
          </div>
        )}
      </section>

      {/* Lokasi & COD */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sell-area" className="flex items-center gap-1">
            <MapPin className="size-3.5 text-bu-red" aria-hidden /> Area publik
          </Label>
          <Input
            id="sell-area"
            required
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Contoh: Bekasi Utara"
            className="rounded-lg"
          />
          <p className="text-xs text-muted-foreground">
            Alamat lengkap gak dipublish — cuma area umum. Titik COD presisi
            dibagi belakangan, setelah deal.
          </p>
        </div>
        <Label className="flex items-center gap-2.5 font-semibold">
          <Checkbox
            checked={codAvailable}
            onCheckedChange={(v) => setCodAvailable(!!v)}
          />
          Bisa COD sekarang
        </Label>
      </section>

      {error && (
        <p role="alert" className="text-sm font-medium text-bu-red-deep">
          {error}
        </p>
      )}

      <div className="sticky bottom-14 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full font-bold"
        >
          Pasang Listing{saleType === "BU" ? " 🔥 BU" : ""}
          {Number(price) > 0 &&
            ` · Rp${(saleType === "BU" && Number(buPrice) ? Number(buPrice) : Number(price)).toLocaleString("id-ID")}`}
        </Button>
      </div>
    </form>
  );
}
