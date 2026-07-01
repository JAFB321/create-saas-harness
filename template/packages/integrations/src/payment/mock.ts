import { getAppBaseUrl } from "@app/db";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  ParsedWebhook,
  PaymentProvider,
} from "../types";
import { WebhookVerificationError } from "../errors";

/**
 * Mock payment provider — the default. Lets the whole app run with NO payment keys.
 * `createCheckout` returns a redirect to the app's own checkout page, which (in mock mode) shows
 * "simulate paid / failed" buttons that POST to the webhook route with a JSON body.
 */
export class MockPaymentProvider implements PaymentProvider {
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const base = getAppBaseUrl();
    return {
      checkoutId: `mock_${input.orderId}`,
      redirectUrl: `${base}/checkout/${input.orderId}`,
    };
  }

  async parseWebhook(req: Request): Promise<ParsedWebhook> {
    // The simulated webhook is unauthenticated JSON that can settle any order — only allow it
    // when dev tools are explicitly enabled (never in production).
    if (process.env.DEV_TOOLS_ENABLED !== "true") {
      throw new WebhookVerificationError("Mock webhooks require DEV_TOOLS_ENABLED=true.");
    }
    const body = (await req.json().catch(() => ({}))) as {
      orderId?: string;
      status?: "paid" | "failed" | "expired";
    };
    const orderId = body.orderId ?? "";
    const status = body.status ?? "paid";
    return {
      orderId,
      status,
      providerRef: `mock_${orderId}`,
      method: "card",
      feeCents: null,
    };
  }
}
