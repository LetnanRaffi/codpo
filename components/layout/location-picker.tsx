"use client";

import { Check, MapPin } from "lucide-react";
import { useState } from "react";

import { useRadius } from "@/components/providers/radius-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { RADIUS_OPTIONS_KM } from "@/lib/config";

export function LocationPicker() {
  const { radiusKm, setRadiusKm, position, setPosition } = useRadius();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 rounded-full font-mono text-xs"
          aria-label={`Lokasi ${position ? "aktif" : "belum aktif"}, radius ${radiusKm} km — ubah radius`}
        >
          <MapPin className="size-3.5 text-bu-red" />
          <span className="hidden sm:inline">
            {position ? "Lokasi saya" : "Pilih lokasi"}
          </span>
          <span>{radiusKm} km</span>
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
              setRadiusKm(km);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            <span className="font-mono">{km} km</span>
            {radiusKm === km && (
              <Check className="size-4 text-trust-green" aria-hidden />
            )}
          </button>
        ))}
        <Separator className="my-1.5" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            navigator.geolocation?.getCurrentPosition(({ coords }) => {
              setPosition({ lat: coords.latitude, lng: coords.longitude });
              setOpen(false);
            });
          }}
        >
          <MapPin className="size-3.5" />{" "}
          {position ? "Perbarui lokasi" : "Gunakan lokasi perangkat"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
