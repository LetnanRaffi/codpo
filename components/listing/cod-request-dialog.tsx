"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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

export function CodRequestDialog({
  listingTitle,
  trigger,
}: {
  listingTitle: string;
  trigger: React.ReactNode;
}) {
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSent(false);
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
                setSent(true);
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cod-date">Tanggal</Label>
                  <Input
                    id="cod-date"
                    type="date"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cod-time">Jam</Label>
                  <Input
                    id="cod-time"
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
                  required
                  placeholder="Contoh: Alun-alun Bekasi, depan McDonald's"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cod-note">Catatan (opsional)</Label>
                <Textarea
                  id="cod-note"
                  rows={2}
                  placeholder="Contoh: Gue bawa uang pas ya"
                  className="rounded-lg"
                />
              </div>
            </form>
            <DialogFooter>
              <Button
                type="submit"
                form="cod-request-form"
                className="w-full rounded-full sm:w-auto"
              >
                Kirim ajukan COD
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
