"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { MapCoordinate } from "./map-canvas";

const MapCanvas = dynamic(
  () => import("./map-canvas").then((module) => module.MapCanvas),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />,
  },
);

export function MapPicker({
  value,
  fallback,
  onChange,
}: {
  value: MapCoordinate | null;
  fallback: MapCoordinate;
  onChange: (point: MapCoordinate) => void;
}) {
  const point = value ?? fallback;
  const stableCenter = useMemo(() => fallback, [fallback.lat, fallback.lng]);
  return (
    <div className="space-y-2">
      <MapCanvas
        center={stableCenter}
        meetingPoint={point}
        onMeetingPointChange={onChange}
        className="h-64 w-full overflow-hidden rounded-xl border"
      />
      <p className="text-[11px] text-muted-foreground">
        Klik peta atau geser pin hijau untuk memilih titik temu. Alamat lengkap tidak dipublikasikan.
      </p>
    </div>
  );
}
