import { z } from "zod";

export const settleOrderInput = z.object({
  status: z.enum(["paid", "failed", "expired"]),
  method: z.enum(["card", "cash", "transfer", "other"]).default("card"),
  providerRef: z.string().min(1),
  /** Provider processing fee in cents; null means "unknown" (don't overwrite a prior value). */
  feeCents: z.number().int().nullable().default(null),
});
