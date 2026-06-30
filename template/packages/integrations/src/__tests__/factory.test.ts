import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEmailProvider, getStorageProvider, resetProviders } from "../factory";
import { MockEmailProvider } from "../email/mock";
import { MockStorageProvider } from "../storage/mock";

describe("provider factory (mock-first)", () => {
  beforeEach(() => {
    resetProviders();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    resetProviders();
    vi.unstubAllEnvs();
  });

  it("falls back to mock email when no keys are set", () => {
    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(getEmailProvider()).toBeInstanceOf(MockEmailProvider);
  });

  it("falls back to mock storage when no keys are set", () => {
    vi.stubEnv("STORAGE_PROVIDER", "s3");
    vi.stubEnv("S3_ENDPOINT", "");
    expect(getStorageProvider()).toBeInstanceOf(MockStorageProvider);
  });
});
