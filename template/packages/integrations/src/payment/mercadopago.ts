import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getAppBaseUrl } from "@app/db";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  ParsedWebhook,
  PaymentProvider,
} from "../types";
import { ProviderConfigError } from "../errors";

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

  async parseWebhook(req: Request): Promise<ParsedWebhook> {
    const body = (await req.json().catch(() => ({}))) as {
      data?: { id?: string };
      type?: string;
    };
    const paymentId = body.data?.id;
    if (!paymentId || body.type !== "payment") {
      return { orderId: "", status: "failed", providerRef: "", method: "other", feeCents: null };
    }
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
