"use client";

import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client/api";

const NEXT_STATE: Record<string, { state: string; label: string }> = {
  accepted: { state: "scheduled", label: "Konfirmasi jadwal" },
  scheduled: { state: "otw", label: "Mulai OTW" },
  otw: { state: "near_location", label: "Sudah dekat" },
  near_location: { state: "arrived", label: "Sudah sampai" },
  arrived: { state: "item_check", label: "Mulai cek barang" },
  item_check: { state: "completed", label: "Selesaikan transaksi" },
};

export function CodSessionActions({
  sessionId,
  state,
  role,
  onUpdated,
}: {
  sessionId: string;
  state: string;
  role: "buyer" | "seller";
  onUpdated?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const next = NEXT_STATE[state];
  const canAdvance =
    next && !(role === "seller" && ["arrived", "item_check"].includes(state));
  const moving = ["otw", "near_location", "arrived"].includes(state);
  const canCancel = [
    "accepted",
    "scheduled",
    "otw",
    "near_location",
    "arrived",
  ].includes(state);
  async function transition(target: string) {
    setPending(true);
    setMessage("");
    try {
      await apiFetch(`/api/cod/sessions/${sessionId}/state`, {
        method: "POST",
        body: JSON.stringify({ state: target }),
      });
      setMessage("Status diperbarui");
      onUpdated?.();
      if (!onUpdated) router.refresh();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Gagal memperbarui status",
      );
    } finally {
      setPending(false);
    }
  }
  async function shareLocation() {
    if (!navigator.geolocation) {
      setMessage("Browser tidak mendukung lokasi");
      return;
    }
    setPending(true);
    setMessage("Meminta lokasi…");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await apiFetch(`/api/cod/sessions/${sessionId}/location`, {
            method: "PATCH",
            body: JSON.stringify({ enabled: true }),
          });
          const result = await apiFetch<{ status: string }>(
            `/api/cod/sessions/${sessionId}/location`,
            {
              method: "POST",
              body: JSON.stringify({
                lat: coords.latitude,
                lng: coords.longitude,
                accuracy_m: Math.round(coords.accuracy),
              }),
            },
          );
          setMessage(
            result.status === "stored"
              ? "Lokasi terbaru dibagikan"
              : "Lokasi belum berubah cukup jauh",
          );
          onUpdated?.();
        } catch (cause) {
          setMessage(
            cause instanceof Error ? cause.message : "Gagal membagikan lokasi",
          );
        } finally {
          setPending(false);
        }
      },
      () => {
        setPending(false);
        setMessage("Izin lokasi ditolak");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        {canAdvance && (
          <Button
            size="sm"
            className="rounded-full"
            disabled={pending}
            onClick={() => void transition(next.state)}
          >
            {next.label}
          </Button>
        )}
        {moving && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={pending}
            onClick={() => void shareLocation()}
          >
            <MapPin /> Bagikan lokasi
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-bu-red-deep"
            disabled={pending}
            onClick={() => void transition("cancelled")}
          >
            Batalkan
          </Button>
        )}
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
