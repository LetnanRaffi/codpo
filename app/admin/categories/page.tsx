"use client";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/client/api";
interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
  active: boolean;
}
export default function Page() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      apiFetch<{ items: CategoryRow[] }>("/api/admin/categories")
        .then((data) => setRows(data.items))
        .catch((cause) => setError(cause.message)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const save = async (row: Omit<CategoryRow, "id">) => {
    setError("");
    try {
      await apiFetch("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(row),
      });
      setName("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal");
    }
  };
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">
          Categories
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Kategori database yang dipakai marketplace
        </p>
      </div>
      <form
        className="flex max-w-md gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const clean = name.trim();
          if (clean)
            void save({
              slug: slugify(clean),
              name: clean,
              icon: null,
              sort_order: rows.length + 1,
              active: true,
            });
        }}
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama kategori baru"
          className="rounded-full"
        />
        <Button className="rounded-full" disabled={!name.trim()}>
          <Plus /> Tambah
        </Button>
      </form>
      {error && <p className="text-sm text-bu-red-deep">{error}</p>}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground uppercase">
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.slug}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="rounded-full">
                    {row.active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void save({
                        slug: row.slug,
                        name: row.name,
                        icon: row.icon,
                        sort_order: row.sort_order,
                        active: !row.active,
                      })
                    }
                  >
                    {row.active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
