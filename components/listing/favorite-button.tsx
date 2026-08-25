"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client/api";

export function FavoriteButton({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (user)
      void apiFetch<{ items: { listing_id: string }[] }>("/api/favorites").then(
        (data) =>
          setActive(data.items.some((item) => item.listing_id === listingId)),
      );
  }, [listingId, user]);
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="rounded-full"
      disabled={pending}
      aria-label={active ? "Hapus dari favorit" : "Simpan ke favorit"}
      onClick={async () => {
        if (!user) {
          router.push(`/login?next=/listing/${listingId}`);
          return;
        }
        setPending(true);
        try {
          await apiFetch(`/api/favorites/${listingId}`, {
            method: active ? "DELETE" : "POST",
          });
          setActive(!active);
        } finally {
          setPending(false);
        }
      }}
    >
      <Heart className={active ? "fill-bu-red text-bu-red" : ""} />
    </Button>
  );
}
