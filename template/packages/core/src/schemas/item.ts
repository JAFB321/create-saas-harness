import { z } from "zod";

/**
 * The example CRUD resource ("item"). MVP-1 of your generated roadmap renames/replaces this with
 * your real core entity — it's here so the shell runs and demonstrates the full pattern
 * (zod at the boundary → server action → RLS-protected table).
 */
export const itemStatus = z.enum(["draft", "active", "archived"]);
export type ItemStatus = z.infer<typeof itemStatus>;

export const createItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(2000).optional().default(""),
});

export const updateItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  status: itemStatus.optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
