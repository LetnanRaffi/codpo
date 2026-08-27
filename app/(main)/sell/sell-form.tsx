"use client";

import { CheckCircle2, Flame, ImagePlus, MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PriceStrike } from "@/components/price-strike";
import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch } from "@/lib/client/api";
import { CONDITION_LABELS } from "@/lib/listing";
import type { Category, Condition } from "@/lib/types";
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

export function SellForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { user, profile, loading: authLoading, setMode } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const [photos, setPhotos] = useState<
    { url: string; name: string; file: File }[]
  >([]);
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
  const [pending, setPending] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const selected = Array.from(files).slice(0, room);
    const accepted = selected.filter(
      (file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
        file.size <= 4 * 1024 * 1024,
    );
    const next = accepted.map((f) => {
      const url = URL.createObjectURL(f);
      objectUrlsRef.current.add(url);
      return { url, name: f.name, file: f };
    });
    if (accepted.length !== selected.length || files.length > room) {
      setError(
        `Sebagian foto dilewati. Gunakan JPG, PNG, atau WebP maksimal 4 MB; maksimal ${MAX_PHOTOS} foto.`,
      );
    } else {
      setError("");
    }
    setPhotos((p) => [...p, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(url: string) {
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
    setPhotos((p) => p.filter((x) => x.url !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) {
      router.push("/login?next=/sell");
      return;
    }
    if (photos.length === 0) {
      setError("Minimal 1 foto barang.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!categorySlug || !condition) {
      setError("Pilih kategori dan kondisi barang.");
      return;
    }
    if (!position) {
      setError(
        "Ambil lokasi listing dulu agar barang bisa ditemukan pembeli sekitar.",
      );
      return;
    }
    if (
      saleType === "BU" &&
      (!Number(buPrice) || Number(buPrice) >= Number(price))
    ) {
      setError("Harga BU harus lebih murah dari harga normal.");
      return;
    }

    setPending(true);
    let createdId: string | null = null;
    try {
      const durationMs =
        buDuration === "7d"
          ? 7 * 86400000
          : buDuration === "3d"
            ? 3 * 86400000
            : 86400000;
      const created = await apiFetch<{ id: string }>("/api/listings", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category_slug: categorySlug,
          condition,
          normal_price: Number(price),
          bu_price: saleType === "BU" ? Number(buPrice) : null,
          bu_expires_at:
            saleType === "BU"
              ? new Date(Date.now() + durationMs).toISOString()
              : null,
          sale_type: saleType,
          cod_available: codAvailable,
          area_label: area,
          lat: position.lat,
          lng: position.lng,
        }),
      });
      createdId = created.id;
      for (const photo of photos) {
        try {
          await apiFetch<{ key: string }>("/api/upload/proxy", {
            method: "POST",
            body: (() => { const form = new FormData(); form.append("file", photo.file); form.append("listing_id", created.id); return form; })(),
          });
        } catch (cause) {
          const reason = cause instanceof Error ? cause.message : "gagal upload";
          throw new Error(`Foto ${photos.indexOf(photo) + 1} (${photo.name}) gagal: ${reason}`);
        }
      }
      for (const photo of photos) {
        URL.revokeObjectURL(photo.url);
        objectUrlsRef.current.delete(photo.url);
      }
      setSubmitted(true);
      router.push(`/listing/${created.id}`);
      router.refresh();
    } catch (cause) {
      if (createdId) {
        await apiFetch(`/api/listings/${createdId}`, {
          method: "DELETE",
        }).catch((cleanupError) =>
          console.error("[sell.cleanup]", cleanupError),
        );
      }
      setError(
        cause instanceof Error ? cause.message : "Gagal memasang listing",
      );
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
        <CheckCircle2 className="size-10 text-trust-green" aria-hidden />
        <p className="font-display text-2xl font-bold tracking-wide uppercase">
          Listing siap tayang
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Data dan foto sudah tersimpan. Listing kamu sekarang muncul di feed.
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

  if (!authLoading && user && profile?.mode !== "seller") {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="font-display text-2xl font-bold uppercase">Aktifkan mode jual</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Kamu sedang berada di mode beli. Aktifkan mode jual dulu supaya dashboard, listing, dan request COD tidak tercampur.
        </p>
        <Button type="button" className="mt-5 rounded-full font-bold" onClick={() => void setMode("seller").then(() => router.refresh())}>
          Mulai jual barang
        </Button>
      </div>
    );
  }

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
            {categories.map((c) => (
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
                <PriceStrike>
                  {Number(price).toLocaleString("id-ID")}
                </PriceStrike>{" "}
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              if (!navigator.geolocation) {
                setError("Browser tidak mendukung lokasi.");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                  setPosition({ lat: coords.latitude, lng: coords.longitude });
                  setError("");
                },
                () =>
                  setError(
                    "Izin lokasi ditolak. Aktifkan lokasi browser lalu coba lagi.",
                  ),
                { enableHighAccuracy: true, timeout: 10000 },
              );
            }}
          >
            <MapPin className="size-3.5" />{" "}
            {position ? "Lokasi sudah diambil" : "Ambil lokasi perangkat"}
          </Button>
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

      <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        <Button
          type="submit"
          size="lg"
          disabled={pending || authLoading}
          className="w-full rounded-full font-bold"
        >
          {pending
            ? "Menyimpan & mengunggah…"
            : `Pasang Listing${saleType === "BU" ? " 🔥 BU" : ""}`}
          {Number(price) > 0 &&
            ` · Rp${(saleType === "BU" && Number(buPrice) ? Number(buPrice) : Number(price)).toLocaleString("id-ID")}`}
        </Button>
      </div>
    </form>
  );
}
