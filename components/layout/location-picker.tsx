"use client";

import { Check, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { useRadius } from "@/components/providers/radius-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { PILOT_AREAS, RADIUS_OPTIONS_KM } from "@/lib/config";

export function LocationPicker() {
  const { radiusKm, setRadiusKm, position, setPosition } = useRadius();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (position || window.localStorage.getItem("codpo-location-prompted")) return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      window.localStorage.setItem("codpo-location-prompted", "1");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [position]);

  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setError("Browser ini tidak mendukung lokasi. Pilih area manual.");
      return;
    }
    setError("");
    window.localStorage.setItem("codpo-location-prompted", "1");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude, label: "Lokasi saya" });
        setOpen(false);
      },
      () => setError("Izin lokasi ditolak. Pilih area manual atau coba lagi."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

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
        <p className="px-2 py-1 text-[11px] text-muted-foreground">
          Lokasi hanya dipakai untuk mengurutkan listing. Seller jauh tetap tampil.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={useDeviceLocation}
        >
          <MapPin className="size-3.5" />{" "}
          {position ? "Perbarui lokasi" : "Gunakan lokasi perangkat"}
        </Button>
        <div className="mt-1 grid grid-cols-2 gap-1 px-1">
          {PILOT_AREAS.map((area) => (
            <button
              key={area.label}
              type="button"
              className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
              onClick={() => {
                setPosition(area);
                setError("");
                setOpen(false);
              }}
            >
              {area.label}
            </button>
          ))}
        </div>
        {error && <p className="px-2 pt-1 text-xs text-bu-red-deep">{error}</p>}
      </PopoverContent>
    </Popover>
  );
}
