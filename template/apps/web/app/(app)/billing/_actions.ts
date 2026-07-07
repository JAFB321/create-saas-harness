"use server";

import { redirect } from "next/navigation";
import { getPlan, type Plan } from "@app/core";
import { createServiceClient } from "@app/db";
import { getPaymentProvider } from "@app/integrations";
import { requireUser } from "@/lib/auth";

/**
 * Starts a one-time checkout for a plan upgrade. Creates the order server-side (service role),
 * then asks the active payment provider for a checkout URL and redirects there.
 * (A production app would likely use the provider's subscription APIs; this demonstrates the
 * order → checkout → webhook → settle loop end to end with the mock provider.)
 */
export async function startCheckoutAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const planId = String(formData.get("plan") ?? "pro") as Plan;
  const plan = getPlan(planId);
  if (plan.priceCents <= 0) return;

  const db = createServiceClient();
  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: user.id,
      amount_cents: plan.priceCents,
      currency: "usd",
      idempotency_key: crypto.randomUUID(),
      metadata: { plan: plan.id, kind: "plan_upgrade" },
    })
    .select("id")
    .single();
  if (error || !order) throw new Error(error?.message ?? "Could not create order");

  // The webhook reads the plan from the ORDER row's metadata (set above), not from the provider.
  const checkout = await getPaymentProvider().createCheckout({
    orderId: order.id,
    amountCents: plan.priceCents,
    currency: "usd",
    description: `${plan.name} plan`,
    customerEmail: user.email,
  });

  redirect(checkout.redirectUrl ?? `/checkout/${order.id}`);
}
