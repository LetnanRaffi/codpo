"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { DEFAULT_RADIUS_KM } from "@/lib/config";

interface RadiusState {
  radiusKm: number;
  setRadiusKm: (km: number) => void;
  position: { lat: number; lng: number; label?: string } | null;
  setPosition: (position: { lat: number; lng: number; label?: string } | null) => void;
}

const RadiusContext = createContext<RadiusState | null>(null);

export function RadiusProvider({ children }: { children: React.ReactNode }) {
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const [position, setPosition] = useState<{ lat: number; lng: number; label?: string } | null>(
    null,
  );
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = localStorage.getItem("codpo-location");
      if (raw) {
        try {
          setPosition(JSON.parse(raw));
        } catch {
          localStorage.removeItem("codpo-location");
        }
      }
      const radius = Number(localStorage.getItem("codpo-radius"));
      if ([1, 3, 5, 10, 25].includes(radius)) setRadiusKm(radius);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const updateRadius = (km: number) => {
    setRadiusKm(km);
    localStorage.setItem("codpo-radius", String(km));
  };
  const updatePosition = (next: { lat: number; lng: number; label?: string } | null) => {
    setPosition(next);
    if (next) localStorage.setItem("codpo-location", JSON.stringify(next));
    else localStorage.removeItem("codpo-location");
  };
  const value = useMemo(
    () => ({
      radiusKm,
      setRadiusKm: updateRadius,
      position,
      setPosition: updatePosition,
    }),
    [radiusKm, position],
  );

  return (
    <RadiusContext.Provider value={value}>{children}</RadiusContext.Provider>
  );
}

export function useRadius() {
  const ctx = useContext(RadiusContext);
  if (!ctx) throw new Error("useRadius harus dipakai di dalam RadiusProvider");
  return ctx;
}
