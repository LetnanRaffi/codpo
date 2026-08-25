"use client";
import { Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/client/api";
const REASONS = [
  { value: "scam", label: "Penipuan" },
  { value: "fake_item", label: "Barang palsu" },
  { value: "misleading_listing", label: "Informasi menyesatkan" },
  { value: "prohibited_item", label: "Barang terlarang" },
] as const;
export function ReportDialog({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [reason, setReason] =
    useState<(typeof REASONS)[number]["value"]>("scam");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground"
        >
          <Flag /> Laporkan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laporkan listing</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => setReason(item.value)}
              className={`rounded-full border px-3 py-1.5 text-xs ${reason === item.value ? "bg-secondary font-semibold" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Jelaskan masalahnya (opsional)"
        />
        <Button
          onClick={() => {
            if (!user) {
              router.push(`/login?next=/listing/${listingId}`);
              return;
            }
            void apiFetch("/api/reports", {
              method: "POST",
              body: JSON.stringify({
                target_type: "listing",
                target_id: listingId,
                reason,
                description: description || undefined,
              }),
            })
              .then(() => setMessage("Laporan terkirim"))
              .catch((cause) => setMessage(cause.message));
          }}
        >
          Kirim laporan
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </DialogContent>
    </Dialog>
  );
}
