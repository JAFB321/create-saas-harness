import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getAppBaseUrl } from "@app/db";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  ParsedWebhook,
  PaymentProvider,
} from "../types";
import { ProviderConfigError, WebhookVerificationError } from "../errors";

/**
 * MercadoPago's documented HMAC check: x-signature carries `ts=...,v1=...`; v1 is the
 * HMAC-SHA256 (hex) of `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` with the webhook secret.
 */
function verifySignature(req: Request, dataId: string, secret: string): void {
  const parts = new Map(
    (req.headers.get("x-signature") ?? "")
      .split(",")
      .map((p) => p.trim().split("=", 2) as [string, string]),
  );
  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) throw new WebhookVerificationError("MercadoPago x-signature header is missing.");

  const manifest = `id:${dataId};request-id:${req.headers.get("x-request-id") ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new WebhookVerificationError("MercadoPago signature verification failed.");
  }
}

/** Env value that selects this provider + its readiness check (used by status.ts). */
export const PROVIDER_NAME = "mercadopago";
export function isConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

/**
 * MercadoPago Checkout Pro provider. Requires MERCADOPAGO_ACCESS_TOKEN.
 * The order id travels in `external_reference` so the webhook can resolve it back.
 */
export class MercadoPagoProvider implements PaymentProvider {
  private client: MercadoPagoConfig;

  constructor() {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new ProviderConfigError(
        "MERCADOPAGO_ACCESS_TOKEN is required for the MercadoPago provider.",
      );
    }
    this.client = new MercadoPagoConfig({ accessToken: token });
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const base = getAppBaseUrl();
    const pref = await new Preference(this.client).create({
      body: {
        external_reference: input.orderId,
        metadata: { order_id: input.orderId },
        notification_url: `${base}/api/webhooks/payments`,
        back_urls: {
          success: input.successUrl ?? `${base}/checkout/${input.orderId}?status=success`,
          failure: input.cancelUrl ?? `${base}/checkout/${input.orderId}?status=cancel`,
          pending: `${base}/checkout/${input.orderId}?status=pending`,
        },
        auto_return: "approved",
        payer: input.customerEmail ? { email: input.customerEmail } : undefined,
        items: [
          {
            id: input.orderId,
            title: input.description ?? "Order",
            quantity: 1,
            unit_price: input.amountCents / 100,
            currency_id: input.currency.toUpperCase(),
          },
        ],
      },
    });
    return { checkoutId: String(pref.id ?? ""), redirectUrl: pref.init_point ?? undefined };
  }

  async parseWebhook(req: Request): Promise<ParsedWebhook | null> {
    // Verification is NOT optional: without the secret an attacker could settle arbitrary orders
    // by POSTing payment ids. Fail loudly instead of silently trusting the body.
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) {
      throw new ProviderConfigError(
        "MERCADOPAGO_WEBHOOK_SECRET is required to verify webhooks for the MercadoPago provider.",
      );
    }
    const body = (await req.json().catch(() => ({}))) as {
      data?: { id?: string };
      type?: string;
    };
    const paymentId = body.data?.id;
    // Non-payment topics (merchant_order, …) are ignorable.
    if (!paymentId || body.type !== "payment") return null;
    verifySignature(req, paymentId, secret);
    // Fetch the payment with our token to learn the order + status (don't trust the webhook body).
    const payment = await new Payment(this.client).get({ id: paymentId });
    const orderId = payment.external_reference ?? "";
    const approved = payment.status === "approved";
    const feeDetail = (payment.fee_details ?? []).find((f) => f.type === "mercadopago_fee");
    return {
      orderId,
      status: approved ? "paid" : payment.status === "cancelled" ? "expired" : "failed",
      providerRef: String(payment.id ?? paymentId),
      method: "card",
      feeCents: typeof feeDetail?.amount === "number" ? Math.round(feeDetail.amount * 100) : null,
    };
  }
}
