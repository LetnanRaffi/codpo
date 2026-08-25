"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/client/api";
interface Editable {
  id: string;
  title: string;
  description: string;
  normal_price: number;
  bu_price: number | null;
  bu_expires_at: string | null;
  sale_type: "NORMAL" | "BU";
  cod_available: boolean;
  area_label: string;
  status: "active" | "inactive";
}
export function ListingEditForm({ listing }: { listing: Editable }) {
  const router = useRouter();
  const [form, setForm] = useState(listing);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const update = <K extends keyof Editable>(key: K, value: Editable[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <form
      className="space-y-4 rounded-xl border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        const bu = form.sale_type === "BU";
        const currentExpiry = form.bu_expires_at
          ? new Date(form.bu_expires_at)
          : null;
        const buExpiry =
          currentExpiry && currentExpiry > new Date()
            ? currentExpiry.toISOString()
            : new Date(Date.now() + 86400000).toISOString();
        void apiFetch(`/api/listings/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            normal_price: Number(form.normal_price),
            bu_price: bu ? Number(form.bu_price) : null,
            bu_expires_at: bu ? buExpiry : null,
            sale_type: form.sale_type,
            cod_available: form.cod_available,
            area_label: form.area_label,
            status: form.status,
          }),
        })
          .then(() => {
            setMessage("Listing tersimpan");
            router.refresh();
          })
          .catch((cause) => setMessage(cause.message))
          .finally(() => setPending(false));
      }}
    >
      <div className="space-y-1.5">
        <Label>Judul</Label>
        <Input
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Deskripsi</Label>
        <Textarea
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          rows={5}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Harga normal</Label>
          <Input
            inputMode="numeric"
            value={form.normal_price}
            onChange={(event) =>
              update(
                "normal_price",
                Number(event.target.value.replace(/\D/g, "")),
              )
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Harga BU</Label>
          <Input
            inputMode="numeric"
            disabled={form.sale_type !== "BU"}
            value={form.bu_price ?? ""}
            onChange={(event) =>
              update("bu_price", Number(event.target.value.replace(/\D/g, "")))
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["NORMAL", "BU"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`rounded-xl border py-2 text-sm font-bold ${form.sale_type === value ? "bg-secondary" : ""}`}
            onClick={() => update("sale_type", value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label>Area publik</Label>
        <Input
          value={form.area_label}
          onChange={(event) => update("area_label", event.target.value)}
        />
      </div>
      <Label className="flex items-center gap-2">
        <Checkbox
          checked={form.cod_available}
          onCheckedChange={(value) => update("cod_available", !!value)}
        />{" "}
        Bisa COD
      </Label>
      <Label className="flex items-center gap-2">
        <Checkbox
          checked={form.status === "active"}
          onCheckedChange={(value) =>
            update("status", value ? "active" : "inactive")
          }
        />{" "}
        Listing aktif
      </Label>
      <Button className="w-full rounded-full" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}
