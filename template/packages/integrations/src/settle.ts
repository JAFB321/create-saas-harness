import { z } from "zod";
import { canSettle, formatMoney, nextOrderStatus } from "@app/core";
import { createServiceClient, type Tables } from "@app/db";
import { settleOrderInput } from "./schemas";
import { OrderNotFoundError } from "./errors";
import { getEmailProvider } from "./factory";
import { logger } from "./logger";

export type OrderRow = Tables<"orders">;

export type SettleOrderInput = z.input<typeof settleOrderInput>;

export interface SettleOrderResult {
  order: OrderRow;
  alreadySettled: boolean;
}

/**
 * The SINGLE mutator of the payment state machine. Idempotent and "paid always wins":
 *  - ALWAYS inserts a payment_events row (append-only audit).
 *  - A `paid` rescues the order from pending|failed|expired; the conditional UPDATE EXCLUDES `paid`
 *    from its filter so concurrent webhooks only fulfill once.
 *  - A `failed`/`expired` only applies from `pending` (terminals are not degraded).
 *  - Only the effective first step to `paid` triggers fulfillment (receipt email here).
 */
export async function settleOrder(
  orderId: string,
  input: SettleOrderInput,
): Promise<SettleOrderResult> {
  // Real webhooks pass the provider's external reference RAW (may be empty or non-UUID).
  // Map to OrderNotFoundError (the route 200-ignores) so a poisoned webhook isn't retried forever.
  if (!z.string().uuid().safeParse(orderId).success) {
    logger.warn("settle_invalid_order_ref", { len: orderId?.length ?? 0 });
    throw new OrderNotFoundError(orderId);
  }

  const parsed = settleOrderInput.parse(input);
  const db = createServiceClient();

  const { data: current, error: readErr } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!current) throw new OrderNotFoundError(orderId);

  // Audit is best-effort; a failed audit must not abort the settle.
  const { error: auditErr } = await db.from("payment_events").insert({
    order_id: orderId,
    type: `settle:${parsed.status}`,
    raw: { status: parsed.status, method: parsed.method, providerRef: parsed.providerRef },
  });
  if (auditErr) {
    logger.error("settle_audit_failed", { orderId, error: auditErr.message });
  }

  if (!canSettle(current.status, parsed.status)) {
    return { order: current, alreadySettled: true };
  }

  // Conditional UPDATE: for `paid`, rescue from pending|failed|expired but EXCLUDE `paid` from the
  // filter so only the first concurrent webhook fulfills.
  const next = nextOrderStatus(current.status, parsed.status);
  const update = db
    .from("orders")
    .update({
      status: next,
      provider_ref: parsed.providerRef,
      payment_method: parsed.method,
      paid_at: parsed.status === "paid" ? new Date().toISOString() : current.paid_at,
      ...(parsed.feeCents !== null ? { fee_cents: parsed.feeCents } : {}),
    })
    .eq("id", orderId);
  const { data: updated, error: updErr } = await (
    parsed.status === "paid"
      ? update.in("status", ["pending", "failed", "expired"])
      : update.eq("status", "pending")
  )
    .select("*")
    .maybeSingle();
  if (updErr) throw updErr;

  if (!updated) {
    const { data: reread } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
    return { order: reread ?? current, alreadySettled: true };
  }

  // First effective step to `paid` fulfills (receipt). Best-effort — never reverts payment.
  if (parsed.status === "paid" && updated.user_id) {
    try {
      const { data: profile } = await db
        .from("profiles")
        .select("email, full_name")
        .eq("id", updated.user_id)
        .maybeSingle();
      if (profile?.email) {
        await getEmailProvider().sendEmail({
          to: profile.email,
          template: "payment_receipt",
          vars: {
            name: profile.full_name ?? "",
            amount: formatMoney(updated.amount_cents, updated.currency),
          },
        });
      }
    } catch (e) {
      logger.error("settle_email_failed", {
        orderId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { order: updated, alreadySettled: false };
}
