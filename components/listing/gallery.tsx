"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function Gallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-2">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-paper-soft">
        {images[active] ? (
          <Image
            src={images[active]}
            alt={`${title} — foto ${active + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center"
          >
            <span className="font-display text-[8rem] font-bold text-ink/10 select-none">
              {title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div
          className="flex [scrollbar-width:none] gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Foto barang"
        >
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Lihat foto ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-bu-red" : "border-transparent",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
