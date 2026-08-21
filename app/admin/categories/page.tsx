"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/mock/data";

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState(
    CATEGORIES.map((c) => ({ ...c, disabled: false })),
  );
  const [newName, setNewName] = useState("");

  function slugify(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function addCategory() {
    const name = newName.trim();
    if (!name) return;
    if (cats.some((c) => c.slug === slugify(name))) return;
    setCats((c) => [
      ...c,
      {
        id: `cat-local-${Date.now()}`,
        slug: slugify(name),
        name,
        disabled: false,
      },
    ]);
    setNewName("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
          Categories
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Kategori configurable — perubahan di halaman ini demo lokal saja
        </p>
      </div>

      <form
        className="flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addCategory();
        }}
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama kategori baru"
          aria-label="Nama kategori baru"
          className="rounded-full"
        />
        <Button
          type="submit"
          className="rounded-full"
          disabled={!newName.trim()}
        >
          <Plus aria-hidden /> Tambah
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cats.map((c) => (
              <tr
                key={c.id}
                className={`hover:bg-accent/50 ${c.disabled ? "opacity-50" : ""}`}
              >
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">
                  {c.disabled ? (
                    <Badge
                      variant="secondary"
                      className="rounded-full opacity-70"
                    >
                      Nonaktif
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-trust-green/15 text-trust-green"
                    >
                      Aktif
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full"
                    onClick={() =>
                      setCats((arr) =>
                        arr.map((x) =>
                          x.id === c.id ? { ...x, disabled: !x.disabled } : x,
                        ),
                      )
                    }
                  >
                    {c.disabled ? "Aktifkan" : "Nonaktifkan"}
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
