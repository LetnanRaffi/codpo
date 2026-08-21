"use client";

import { Check, MapPin } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_RADIUS_KM, RADIUS_OPTIONS_KM } from "@/lib/mock/data";

export function LocationPicker() {
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS_KM);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 rounded-full font-mono text-xs"
          aria-label={`Lokasi Bekasi Utara, radius ${radius} km — ubah radius`}
        >
          <MapPin className="size-3.5 text-bu-red" />
          <span className="hidden sm:inline">Bekasi Utara</span>
          <span>{radius} km</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-2">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Radius pencarian
        </p>
        {RADIUS_OPTIONS_KM.map((km) => (
          <button
            key={km}
            type="button"
            onClick={() => {
              setRadius(km);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            <span className="font-mono">{km} km</span>
            {radius === km && (
              <Check className="size-4 text-trust-green" aria-hidden />
            )}
          </button>
        ))}
        <Separator className="my-1.5" />
        <p className="px-2 pb-1 text-xs leading-relaxed text-muted-foreground">
          Deteksi lokasi otomatis menyusul di fase GPS.
        </p>
      </PopoverContent>
    </Popover>
  );
}
