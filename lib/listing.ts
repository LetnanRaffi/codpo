import type { Condition, Listing } from "@/lib/types";

export const CONDITION_LABELS: Record<Condition, string> = {
  baru: "Baru",
  seperti_baru: "Seperti baru",
  baik: "Baik",
  layak_pakai: "Layak pakai",
};

export function effectivePrice(listing: Listing): number {
  return listing.sale_type === "BU" && listing.bu_price !== null
    ? listing.bu_price
    : listing.price;
}
