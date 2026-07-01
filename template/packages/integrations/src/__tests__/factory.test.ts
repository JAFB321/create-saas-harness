import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEmailProvider, getPaymentProvider, getStorageProvider, resetProviders } from "../factory";
import { MockEmailProvider } from "../email/mock";
import { MockPaymentProvider } from "../payment/mock";
import { MockStorageProvider } from "../storage/mock";
import { REAL_PAYMENT_PROVIDER } from "../payment/real";
import { REAL_EMAIL_PROVIDER } from "../email/real";
import { REAL_STORAGE_PROVIDER } from "../storage/real";

// Scaffold-agnostic: REAL_* names resolve to whatever providers were chosen at scaffold time,
// so these tests hold for every combination the CLI can generate.
describe("provider factory (mock-first)", () => {
  beforeEach(() => {
    resetProviders();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    resetProviders();
    vi.unstubAllEnvs();
  });

  it("defaults to mocks when no provider is requested", () => {
    vi.stubEnv("PAYMENTS_PROVIDER", "");
    vi.stubEnv("EMAIL_PROVIDER", "");
    vi.stubEnv("STORAGE_PROVIDER", "");
    expect(getPaymentProvider()).toBeInstanceOf(MockPaymentProvider);
    expect(getEmailProvider()).toBeInstanceOf(MockEmailProvider);
    expect(getStorageProvider()).toBeInstanceOf(MockStorageProvider);
  });

  it("falls back to mock payment when the real provider has no keys", () => {
    vi.stubEnv("PAYMENTS_PROVIDER", REAL_PAYMENT_PROVIDER);
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "");
    expect(getPaymentProvider()).toBeInstanceOf(MockPaymentProvider);
  });

  it("falls back to mock email when the real provider has no keys", () => {
    vi.stubEnv("EMAIL_PROVIDER", REAL_EMAIL_PROVIDER);
    vi.stubEnv("RESEND_API_KEY", "");
    expect(getEmailProvider()).toBeInstanceOf(MockEmailProvider);
  });

  it("falls back to mock storage when the real provider has no keys", () => {
    vi.stubEnv("STORAGE_PROVIDER", REAL_STORAGE_PROVIDER);
    vi.stubEnv("S3_ENDPOINT", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(getStorageProvider()).toBeInstanceOf(MockStorageProvider);
  });

  it("falls back to mock when the requested provider is not the scaffold-time choice", () => {
    vi.stubEnv("STORAGE_PROVIDER", "some-other-provider");
    expect(getStorageProvider()).toBeInstanceOf(MockStorageProvider);
  });
});
