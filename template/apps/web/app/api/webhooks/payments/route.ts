import { NextResponse } from "next/server";
import { PLAN_IDS, type Plan } from "@app/core";
import { createServiceClient } from "@app/db";
import { getPaymentProvider, logger, OrderNotFoundError, settleOrder } from "@app/integrations";

/**
 * Payment webhook. Verifies + parses via the active provider, then runs the idempotent settle.
 * On a successful plan-upgrade order it applies the plan to the user's profile + subscription.
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

  if (!parsed.orderId) {
    return NextResponse.json({ ignored: "no order reference" }, { status: 200 });
  }

  try {
    const { order, alreadySettled } = await settleOrder(parsed.orderId, {
      status: parsed.status,
      method: parsed.method,
      providerRef: parsed.providerRef,
      feeCents: parsed.feeCents,
    });

    // Apply a plan upgrade when the paid order carries a plan in its metadata.
    // Only on the FIRST effective settle — replayed webhooks must not re-upsert subscriptions.
    if (!alreadySettled && order.status === "paid" && order.user_id) {
      const meta = (order.metadata ?? {}) as { plan?: string };
      if (meta.plan && !PLAN_IDS.includes(meta.plan as Plan)) {
        // Metadata is attacker-influencable; never cast it into the plan enum unchecked.
        logger.warn("webhook_unknown_plan", { orderId: order.id, plan: meta.plan });
      } else if (meta.plan) {
        const plan = meta.plan as Plan;
        const db = createServiceClient();
        // supabase-js does not throw — check `error` and 500 so the provider retries
        // (settleOrder is idempotent, so a retry is safe).
        const { error: profileErr } = await db
          .from("profiles")
          .update({ plan })
          .eq("id", order.user_id);
        if (profileErr) {
          logger.error("webhook_plan_apply_failed", { orderId: order.id, error: profileErr.message });
          return NextResponse.json({ error: "plan apply failed" }, { status: 500 });
        }
        const { error: subErr } = await db
          .from("subscriptions")
          .upsert({ user_id: order.user_id, plan, status: "active" }, { onConflict: "user_id" });
        if (subErr) {
          logger.error("webhook_plan_apply_failed", { orderId: order.id, error: subErr.message });
          return NextResponse.json({ error: "plan apply failed" }, { status: 500 });
        }
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
