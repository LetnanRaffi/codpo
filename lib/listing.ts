import type { Listing } from "@/lib/types";

export function effectivePrice(listing: Listing): number {
  return listing.sale_type === "BU" && listing.bu_price !== null
    ? listing.bu_price
    : listing.price;
}
