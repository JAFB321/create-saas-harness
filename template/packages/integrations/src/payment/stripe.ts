import Stripe from "stripe";
import { getAppBaseUrl } from "@app/db";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  ParsedWebhook,
  PaymentProvider,
} from "../types";
import { ProviderConfigError, WebhookVerificationError } from "../errors";

/** Env value that selects this provider + its readiness check (used by status.ts). */
export const PROVIDER_NAME = "stripe";
export function isConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Stripe Checkout provider. Requires STRIPE_SECRET_KEY (+ STRIPE_WEBHOOK_SECRET for webhooks).
 * The order id travels in `metadata.orderId` so the webhook can resolve it back.
 */
export class StripePaymentProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key)
      throw new ProviderConfigError("STRIPE_SECRET_KEY is required for the Stripe provider.");
    this.stripe = new Stripe(key);
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const base = getAppBaseUrl();
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      success_url: input.successUrl ?? `${base}/checkout/${input.orderId}?status=success`,
      cancel_url: input.cancelUrl ?? `${base}/checkout/${input.orderId}?status=cancel`,
      customer_email: input.customerEmail,
      client_reference_id: input.orderId,
      metadata: { orderId: input.orderId },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amountCents,
            product_data: { name: input.description ?? "Order" },
          },
        },
      ],
    });
    return { checkoutId: session.id, redirectUrl: session.url ?? undefined };
  }

  async parseWebhook(req: Request): Promise<ParsedWebhook | null> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new ProviderConfigError("STRIPE_WEBHOOK_SECRET is required.");
    const sig = req.headers.get("stripe-signature") ?? "";
    const raw = await req.text();

    let event: Stripe.Event;
    try {
      event = await this.stripe.webhooks.constructEventAsync(raw, sig, secret);
    } catch (e) {
      throw new WebhookVerificationError(
        `Stripe signature verification failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      // Async methods (SEPA, OXXO, …) complete with payment_status "unpaid" — that's NOT a
      // failure; the async_payment_* events below deliver the real outcome.
      if (session.payment_status !== "paid") return null;
      return {
        orderId: session.metadata?.orderId ?? session.client_reference_id ?? "",
        status: "paid",
        providerRef: session.payment_intent?.toString() ?? session.id,
        method: "card",
        feeCents: null,
      };
    }
    if (
      event.type === "checkout.session.async_payment_succeeded" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        orderId: session.metadata?.orderId ?? session.client_reference_id ?? "",
        status: event.type === "checkout.session.async_payment_succeeded" ? "paid" : "failed",
        providerRef: session.payment_intent?.toString() ?? session.id,
        method: "card",
        feeCents: null,
      };
    }
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        orderId: session.metadata?.orderId ?? session.client_reference_id ?? "",
        status: "expired",
        providerRef: session.id,
        method: "card",
        feeCents: null,
      };
    }
    // Unhandled event types are ignorable.
    return null;
  }
}
