import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockPaymentProvider } from "../payment/mock";

describe("MockPaymentProvider", () => {
  beforeEach(() => vi.stubEnv("APP_BASE_URL", "http://localhost:3000"));
  afterEach(() => vi.unstubAllEnvs());

  it("creates a checkout that redirects to the app checkout page", async () => {
    const p = new MockPaymentProvider();
    const res = await p.createCheckout({ orderId: "abc", amountCents: 1000, currency: "usd" });
    expect(res.checkoutId).toBe("mock_abc");
    expect(res.redirectUrl).toContain("/checkout/abc");
  });

  it("parses a simulated webhook body", async () => {
    const p = new MockPaymentProvider();
    const req = new Request("http://x/api/webhooks/payments", {
      method: "POST",
      body: JSON.stringify({ orderId: "abc", status: "paid" }),
    });
    const parsed = await p.parseWebhook(req);
    expect(parsed).toMatchObject({ orderId: "abc", status: "paid", method: "card", feeCents: null });
  });
});
