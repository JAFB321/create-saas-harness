import type { EmailProvider, PaymentProvider, StorageProvider } from "./types";
import { MockPaymentProvider } from "./payment/mock";
import { RealPaymentProvider } from "./payment/real";
import { MockEmailProvider } from "./email/mock";
import { ResendProvider } from "./email/resend";
import { MockStorageProvider } from "./storage/mock";
import { S3StorageProvider } from "./storage/s3";
import { logger } from "./logger";
import { selectEmailStatus, selectPaymentStatus, selectStorageStatus } from "./status";

let _payment: PaymentProvider | undefined;
let _email: EmailProvider | undefined;
let _storage: StorageProvider | undefined;

/** Payments: mock by default. The chosen real provider activates only when its keys are present. */
export function getPaymentProvider(): PaymentProvider {
  if (_payment) return _payment;
  const status = selectPaymentStatus();
  if (status.provider === "mock") {
    if (status.requested !== "mock") {
      logger.warn("provider_fallback", {
        integration: "payment",
        requested: status.requested,
        fallback: "mock",
        reason: "missing provider keys",
      });
    }
    _payment = new MockPaymentProvider();
  } else {
    _payment = new RealPaymentProvider();
  }
  return _payment;
}

/** Email: mock by default. `resend` requires RESEND_API_KEY, else -> mock + warning. */
export function getEmailProvider(): EmailProvider {
  if (_email) return _email;
  const status = selectEmailStatus();
  if (status.provider === "resend") {
    _email = new ResendProvider();
  } else {
    if (status.requested !== "mock") {
      logger.warn("provider_fallback", {
        integration: "email",
        requested: status.requested,
        fallback: "mock",
        reason: "RESEND_API_KEY missing",
      });
    }
    _email = new MockEmailProvider();
  }
  return _email;
}

/** Storage: mock by default. `s3` requires S3 keys, else -> mock + warning. */
export function getStorageProvider(): StorageProvider {
  if (_storage) return _storage;
  const status = selectStorageStatus();
  if (status.provider === "s3") {
    _storage = new S3StorageProvider();
  } else {
    if (status.requested !== "mock") {
      logger.warn("provider_fallback", {
        integration: "storage",
        requested: status.requested,
        fallback: "mock",
        reason: "S3 keys missing",
      });
    }
    _storage = new MockStorageProvider();
  }
  return _storage;
}

/** TEST ONLY: clear memoized singletons. */
export function resetProviders(): void {
  _payment = undefined;
  _email = undefined;
  _storage = undefined;
}
