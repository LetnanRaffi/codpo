"use client";
import { Star } from "lucide-react";
import { useState } from "react";
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
export function ReviewDialog({ transactionId }: { transactionId: string }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full">
          <Star /> Beri rating
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Beri rating transaksi</DialogTitle>
        </DialogHeader>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} bintang`}
              onClick={() => setRating(value)}
            >
              <Star
                className={
                  value <= rating
                    ? "fill-gold text-gold"
                    : "text-muted-foreground"
                }
              />
            </button>
          ))}
        </div>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Ceritakan pengalaman COD (opsional)"
        />
        <Button
          onClick={() =>
            void apiFetch("/api/reviews", {
              method: "POST",
              body: JSON.stringify({
                transaction_id: transactionId,
                rating,
                body: body || undefined,
              }),
            })
              .then(() => setMessage("Rating tersimpan"))
              .catch((cause) => setMessage(cause.message))
          }
        >
          Kirim rating
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </DialogContent>
    </Dialog>
  );
}
