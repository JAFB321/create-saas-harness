import { getAppBaseUrl } from "@app/db";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  ParsedWebhook,
  PaymentProvider,
} from "../types";

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
