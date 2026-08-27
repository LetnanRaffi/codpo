"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import { LiveCodMap } from "@/components/map/live-cod-map";
import { CodSessionActions } from "@/components/listing/cod-session-actions";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client/api";

type Session = { id: string; state: string; buyer_id: string; seller_id: string; meeting_point: string; meeting_lat: number | null; meeting_lng: number | null; scheduled_at: string };
type Location = { id: string; user_id: string; lat: number; lng: number; accuracy_m: number | null; recorded_at: string };
type Sharing = { user_id: string; enabled: boolean };

export function LiveCodSession({ sessionId, userId, initial }: { sessionId: string; userId: string; initial: Session }) {
  const [session, setSession] = useState(initial);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sharing, setSharing] = useState<Sharing[]>([]);
  const [error, setError] = useState("");
  const [watching, setWatching] = useState(false);
  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ session: Session; latest_locations: Location[]; sharing: Sharing[] }>(`/api/cod/sessions/${sessionId}`);
      setSession(data.session); setLocations(data.latest_locations ?? []); setSharing(data.sharing ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal memuat lokasi"); }
  }, [sessionId]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 10000); return () => window.clearInterval(timer); }, [load]);
  const ownEnabled = sharing.some((item) => item.user_id === userId && item.enabled);
  const moving = ["otw", "near_location", "arrived"].includes(session.state);
  useEffect(() => {
    if (!watching || !ownEnabled || !moving || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(async ({ coords }) => {
      try { await apiFetch(`/api/cod/sessions/${sessionId}/location`, { method: "POST", body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude, accuracy_m: Math.round(coords.accuracy) }) }); void load(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal mengirim lokasi"); }
    }, () => setError("Izin lokasi ditolak"), { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [load, moving, ownEnabled, sessionId, watching]);
  const center = useMemo(() => session.meeting_lat != null && session.meeting_lng != null ? { lat: session.meeting_lat, lng: session.meeting_lng } : { lat: -6.2, lng: 106.816 }, [session.meeting_lat, session.meeting_lng]);
  const markers = locations.filter((point) => sharing.some((item) => item.user_id === point.user_id && item.enabled)).map((point) => ({ id: point.user_id, lat: point.lat, lng: point.lng, label: point.user_id === userId ? "Posisi kamu" : "Posisi lawan transaksi", description: point.recorded_at ? `Update ${new Date(point.recorded_at).toLocaleTimeString("id-ID")}` : undefined }));
  async function toggleSharing() { try { await apiFetch(`/api/cod/sessions/${sessionId}/location`, { method: "PATCH", body: JSON.stringify({ enabled: !ownEnabled }) }); setWatching(!ownEnabled); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal mengubah izin lokasi"); } }
  return <div className="space-y-4"><div><Link href="/transactions" className="text-sm text-muted-foreground hover:underline">← Kembali ke transaksi</Link><h1 className="mt-2 font-display text-3xl font-bold uppercase">Peta COD</h1><p className="text-sm text-muted-foreground">{session.meeting_point} · {new Date(session.scheduled_at).toLocaleString("id-ID")}</p></div>{error && <p role="alert" className="text-sm text-bu-red-deep">{error}</p>}<LiveCodMap center={center} markers={markers} meetingPoint={center} /><div className="rounded-xl border bg-card p-4"><div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 text-trust-green" /><p className="text-sm">Lokasi hanya terlihat jika kamu dan lawan transaksi sama-sama mengaktifkan berbagi.</p></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant={ownEnabled ? "secondary" : "default"} className="rounded-full" onClick={() => void toggleSharing()} disabled={!moving}>{ownEnabled ? "Matikan lokasi" : "Aktifkan lokasi"}</Button><CodSessionActions sessionId={sessionId} state={session.state} role={session.buyer_id === userId ? "buyer" : "seller"} onUpdated={load} /></div></div></div>;
}
