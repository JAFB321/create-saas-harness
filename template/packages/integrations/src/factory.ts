import type { EmailProvider, PaymentProvider, StorageProvider } from "./types";
import { MockPaymentProvider } from "./payment/mock";
import { RealPaymentProvider } from "./payment/real";
import { MockEmailProvider } from "./email/mock";
import { RealEmailProvider } from "./email/real";
import { MockStorageProvider } from "./storage/mock";
import { RealStorageProvider } from "./storage/real";
import { logger } from "./logger";
import {
  selectEmailStatus,
  selectPaymentStatus,
  selectStorageStatus,
  type IntegrationStatus,
} from "./status";

let _payment: PaymentProvider | undefined;
let _email: EmailProvider | undefined;
let _storage: StorageProvider | undefined;

// Mock-first: if the env requests a real provider but its keys are missing (or the requested name
// is not the one wired at scaffold time), warn once and fall back to the mock — never crash.
function warnIfFallback(integration: string, status: IntegrationStatus): void {
  if (status.requested !== "mock") {
    logger.warn("provider_fallback", {
      integration,
      requested: status.requested,
      fallback: "mock",
      reason: "provider not configured (missing keys or not the scaffold-time choice)",
    });
  }
}

/** Payments: mock by default. The scaffold-time provider activates only when its keys are present. */
export function getPaymentProvider(): PaymentProvider {
  if (_payment) return _payment;
  const status = selectPaymentStatus();
  if (status.provider === "mock") {
    warnIfFallback("payment", status);
    _payment = new MockPaymentProvider();
  } else {
    _payment = new RealPaymentProvider();
  }
  return _payment;
}

/** Email: mock by default. The scaffold-time provider activates only when its keys are present. */
export function getEmailProvider(): EmailProvider {
  if (_email) return _email;
  const status = selectEmailStatus();
  if (status.provider === "mock") {
    warnIfFallback("email", status);
    _email = new MockEmailProvider();
  } else {
    _email = new RealEmailProvider();
  }
  return _email;
}

/** Storage: mock by default. The scaffold-time provider activates only when its keys are present. */
export function getStorageProvider(): StorageProvider {
  if (_storage) return _storage;
  const status = selectStorageStatus();
  if (status.provider === "mock") {
    warnIfFallback("storage", status);
    _storage = new MockStorageProvider();
  } else {
    _storage = new RealStorageProvider();
  }
  return _storage;
}

/** TEST ONLY: clear memoized singletons. */
export function resetProviders(): void {
  _payment = undefined;
  _email = undefined;
  _storage = undefined;
}
