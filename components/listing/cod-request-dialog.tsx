"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPicker } from "@/components/map/map-picker";
import type { MapCoordinate } from "@/components/map/map-canvas";

export function CodRequestDialog({
  listingTitle,
  listingId,
  conversationId,
  meetingFallback,
  trigger,
}: {
  listingTitle: string;
  listingId: string;
  conversationId?: string;
  meetingFallback?: MapCoordinate | null;
  trigger: React.ReactNode;
}) {
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [meetingPoint, setMeetingPoint] = useState<MapCoordinate | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  async function submit(form: HTMLFormElement) {
    if (!user) {
      router.push(`/login?next=/listing/${listingId}`);
      return;
    }
    const data = new FormData(form);
    setPending(true);
    setError("");
    try {
      await apiFetch("/api/cod/requests", {
        method: "POST",
        body: JSON.stringify({
          listing_id: listingId,
          conversation_id: conversationId,
          preferred_date: data.get("date"),
          preferred_time: data.get("time"),
          meeting_point: data.get("place"),
          meeting_lat: meetingPoint?.lat,
          meeting_lng: meetingPoint?.lng,
          note: data.get("note") || undefined,
        }),
      });
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal mengajukan COD");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setMeetingPoint(meetingFallback ?? { lat: -6.2, lng: 106.816666 });
        else {
          setSent(false);
          setMeetingPoint(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-trust-green" aria-hidden />
            <p className="font-display text-xl font-bold tracking-wide uppercase">
              COD diajukan
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Tunggu konfirmasi seller buat{" "}
              <span className="font-medium text-foreground">
                {listingTitle}
              </span>
              . Kamu bakal dapet notifikasi di chat.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold tracking-wide uppercase">
                Ajukan COD
              </DialogTitle>
              <DialogDescription>
                Usulkan waktu &amp; tempat ketemu. Seller bisa terima, tolak,
                atau usul yang lain.
              </DialogDescription>
            </DialogHeader>
            <form
              id="cod-request-form"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submit(e.currentTarget);
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cod-date">Tanggal</Label>
                  <Input
                    id="cod-date"
                    name="date"
                    type="date"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cod-time">Jam</Label>
                  <Input
                    id="cod-time"
                    name="time"
                    type="time"
                    required
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cod-place">Titik temu</Label>
                <Input
                  id="cod-place"
                  name="place"
                  required
                  placeholder="Contoh: Alun-alun Bekasi, depan McDonald's"
                  className="rounded-lg"
                />
              </div>
              {meetingPoint && (
                <MapPicker
                  value={meetingPoint}
                  fallback={meetingPoint}
                  onChange={setMeetingPoint}
                />
              )}
              <div className="space-y-1.5">
                <Label htmlFor="cod-note">Catatan (opsional)</Label>
                <Textarea
                  id="cod-note"
                  name="note"
                  rows={2}
                  placeholder="Contoh: Gue bawa uang pas ya"
                  className="rounded-lg"
                />
              </div>
            </form>
            {error && (
              <p role="alert" className="text-sm font-medium text-bu-red-deep">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="submit"
                form="cod-request-form"
                disabled={pending}
                className="w-full rounded-full sm:w-auto"
              >
                {pending ? "Mengirim…" : "Kirim ajukan COD"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
