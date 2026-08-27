"use client";

import dynamic from "next/dynamic";

import type { MapCoordinate, MapPoint } from "./map-canvas";

const MapCanvas = dynamic(
  () => import("./map-canvas").then((module) => module.MapCanvas),
  {
    ssr: false,
    loading: () => <div className="h-80 w-full animate-pulse rounded-xl bg-muted" />,
  },
);

export function LiveCodMap({
  center,
  markers,
  meetingPoint,
}: {
  center: MapCoordinate;
  markers: MapPoint[];
  meetingPoint: MapCoordinate | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-paper-soft">
      <MapCanvas center={center} markers={markers} meetingPoint={meetingPoint} className="h-80 w-full" />
    </div>
  );
}
