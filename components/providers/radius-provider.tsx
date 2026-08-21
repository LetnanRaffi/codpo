"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { DEFAULT_RADIUS_KM } from "@/lib/mock/data";

interface RadiusState {
  radiusKm: number;
  setRadiusKm: (km: number) => void;
}

const RadiusContext = createContext<RadiusState | null>(null);

export function RadiusProvider({ children }: { children: React.ReactNode }) {
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const value = useMemo(() => ({ radiusKm, setRadiusKm }), [radiusKm]);

  return (
    <RadiusContext.Provider value={value}>{children}</RadiusContext.Provider>
  );
}

export function useRadius() {
  const ctx = useContext(RadiusContext);
  if (!ctx) throw new Error("useRadius harus dipakai di dalam RadiusProvider");
  return ctx;
}
