import { NextResponse } from "next/server";
import type { Plan } from "@app/core";
import { createServiceClient } from "@app/db";
import { getPaymentProvider, OrderNotFoundError, settleOrder } from "@app/integrations";

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
    const { order } = await settleOrder(parsed.orderId, {
      status: parsed.status,
      method: parsed.method,
      providerRef: parsed.providerRef,
      feeCents: parsed.feeCents,
    });

    // Apply a plan upgrade when the paid order carries a plan in its metadata.
    if (order.status === "paid" && order.user_id) {
      const meta = (order.metadata ?? {}) as { plan?: string };
      if (meta.plan) {
        const db = createServiceClient();
        await db.from("profiles").update({ plan: meta.plan as Plan }).eq("id", order.user_id);
        await db.from("subscriptions").upsert(
          { user_id: order.user_id, plan: meta.plan as Plan, status: "active" },
          { onConflict: "user_id" },
        );
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
