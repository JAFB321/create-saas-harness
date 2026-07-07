import { NextResponse } from "next/server";
import { PLAN_IDS, type Plan } from "@app/core";
import { createServiceClient } from "@app/db";
import { getPaymentProvider, logger, OrderNotFoundError, settleOrder } from "@app/integrations";

/**
 * Payment webhook. Verifies + parses via the active provider, then runs the idempotent settle.
 * On a paid plan-upgrade order it applies the plan to the user's profile + subscription.
 * Always returns 200 for ignorable cases so the provider doesn't retry a poisoned event forever.
 */
export async function POST(req: Request) {
  let parsed;
  try {
    parsed = await getPaymentProvider().parseWebhook(req);
  } catch (e) {
    // Signature/parse failure → 400 so the provider knows to retry a genuinely transient issue.
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "bad webhook" },
      { status: 400 },
    );
  }

  if (!parsed?.orderId) {
    return NextResponse.json({ ignored: "no settlement intent" }, { status: 200 });
  }

  try {
    const { order } = await settleOrder(parsed.orderId, {
      status: parsed.status,
      method: parsed.method,
      providerRef: parsed.providerRef,
      feeCents: parsed.feeCents,
    });

    if (order.status === "paid" && order.user_id) {
      const applyError = await applyPlanUpgrade(order.id, order.user_id, order.metadata);
      if (applyError) {
        // 500 → the provider retries; applyPlanUpgrade is idempotent so the retry heals it.
        logger.error("webhook_plan_apply_failed", { orderId: order.id, error: applyError });
        return NextResponse.json({ error: "plan apply failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (e instanceof OrderNotFoundError) {
      return NextResponse.json({ ignored: "unknown order" }, { status: 200 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "settle failed" },
      { status: 500 },
    );
  }
}

/**
 * Applies the plan carried in the order's metadata. Idempotent PER ORDER via a `plan_applied`
 * payment event — NOT gated on "first settle", so a retry after a partial failure (profile
 * updated, subscription upsert failed) still completes the apply, while replays of an old
 * order can never re-apply (and downgrade) a stale plan.
 */
async function applyPlanUpgrade(
  orderId: string,
  userId: string,
  metadata: unknown,
): Promise<string | null> {
  const meta = (metadata ?? {}) as { plan?: string };
  if (!meta.plan) return null;
  if (!PLAN_IDS.includes(meta.plan as Plan)) {
    // Metadata is attacker-influencable; never cast it into the plan enum unchecked.
    logger.warn("webhook_unknown_plan", { orderId, plan: meta.plan });
    return null;
  }
  const plan = meta.plan as Plan;
  const db = createServiceClient();

  const { data: applied, error: readErr } = await db
    .from("payment_events")
    .select("id")
    .eq("order_id", orderId)
    .eq("type", "plan_applied")
    .limit(1)
    .maybeSingle();
  if (readErr) return readErr.message;
  if (applied) return null;

  // supabase-js does not throw — check `error` on each write.
  const { error: profileErr } = await db.from("profiles").update({ plan }).eq("id", userId);
  if (profileErr) return profileErr.message;

  const { error: subErr } = await db
    .from("subscriptions")
    .upsert({ user_id: userId, plan, status: "active" }, { onConflict: "user_id" });
  if (subErr) return subErr.message;

  // Recorded last: if this insert fails the retry re-applies the same values (harmless).
  const { error: evtErr } = await db
    .from("payment_events")
    .insert({ order_id: orderId, type: "plan_applied", raw: { plan } });
  if (evtErr) logger.warn("plan_applied_event_failed", { orderId, error: evtErr.message });
  return null;
}
