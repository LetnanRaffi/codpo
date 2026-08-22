import { z } from "zod";

const uuid = z.string().uuid("id tidak valid");
const price = z.coerce.number().int().min(0).max(100_000_000_000);

export const listingCreateSchema = z.object({
  title: z.string().trim().min(5).max(140),
  description: z.string().max(5000).default(""),
  category_slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
  condition: z.enum(["baru", "seperti_baru", "baik", "layak_pakai"]),
  normal_price: price,
  bu_price: price.nullish(),
  bu_expires_at: z.string().datetime().nullish(),
  sale_type: z.enum(["NORMAL", "BU"]).default("NORMAL"),
  cod_available: z.boolean().default(false),
  area_label: z.string().trim().min(1).max(80),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const listingUpdateSchema = listingCreateSchema.partial();

export const presignSchema = z.object({
  kind: z.enum(["listing", "chat"]),
  mime: z.string(),
  size: z.number().int().positive(),
  listing_id: uuid.optional(),
});

export const conversationOpenSchema = z.object({ listing_id: uuid });

export const messageSendSchema = z
  .object({
    type: z.enum(["text", "image", "location"]).default("text"),
    body: z.string().max(2000).default(""),
    media_key: z
      .string()
      .regex(/^chats\/[a-f0-9-]{36}\/[a-zA-Z0-9._-]{8,120}$/)
      .optional(),
  })
  .refine((v) => v.type !== "text" || v.body.trim().length > 0, {
    message: "pesan teks tidak boleh kosong",
  })
  .refine((v) => v.type !== "image" || !!v.media_key, {
    message: "image butuh media_key dari presign",
  });

export const codRequestCreateSchema = z.object({
  listing_id: uuid,
  conversation_id: uuid.optional(),
  preferred_date: z.string().date(),
  preferred_time: z.string().time(),
  meeting_point: z.string().trim().min(3).max(200),
  note: z.string().max(500).optional(),
});

export const codRequestDecisionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("accept"),
    request_id: uuid,
  }),
  z.object({
    action: z.literal("reject"),
    request_id: uuid,
  }),
  z.object({
    action: z.literal("counter"),
    request_id: uuid,
    counter_date: z.string().date(),
    counter_time: z.string().time(),
    counter_meeting_point: z.string().trim().min(3).max(200),
  }),
]);

export const codStateSchema = z.object({
  state: z.enum([
    "scheduled",
    "otw",
    "near_location",
    "arrived",
    "item_check",
    "completed",
    "cancelled",
    "no_show",
    "disputed",
  ]),
});

export const codLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy_m: z.number().int().min(0).max(10_000).optional(),
});

export const sharingSchema = z.object({ enabled: z.boolean() });

export const reviewCreateSchema = z.object({
  transaction_id: uuid,
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
});

export const reportCreateSchema = z.object({
  target_type: z.enum(["listing", "user", "message"]),
  target_id: uuid,
  reason: z.enum([
    "scam",
    "fake_item",
    "misleading_listing",
    "prohibited_item",
    "inappropriate_content",
    "suspicious_user",
    "price_manipulation",
  ]),
  description: z.string().max(1000).optional(),
});

export const boostPurchaseSchema = z.object({
  product_code: z.string().regex(/^[a-z0-9_]{3,30}$/),
});

// ===== Admin =====
export const adminUserActionSchema = z.object({
  action: z.enum(["suspend", "ban", "restore"]),
  note: z.string().max(300).optional(),
});

export const adminListingModerateSchema = z.object({
  action: z.enum(["remove", "restore"]),
  note: z.string().max(300).optional(),
});

export const adminCategoryUpsertSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().trim().min(2).max(60),
  icon: z.string().max(40).optional(),
  sort_order: z.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
});

export const adminCategoryPatchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  icon: z.string().max(40).optional(),
  sort_order: z.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

export const adminReportResolveSchema = z.object({
  status: z.enum(["reviewing", "resolved", "dismissed"]),
  resolution_note: z.string().max(500).optional(),
});

export const adminBoostProductPatchSchema = z.object({
  price_idr: price.optional(),
  active: z.boolean().optional(),
  duration_hours: z.number().int().min(1).max(720).optional(),
});
