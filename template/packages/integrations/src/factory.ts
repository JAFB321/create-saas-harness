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

// Mock-first: if the env requests a real provider but its keys are missing (or the requested name
// is not the one wired at scaffold time), warn once and fall back to the mock — never crash.
const resets: Array<() => void> = [];

function memoizedProvider<T>(
  integration: string,
  selectStatus: () => IntegrationStatus,
  makeMock: () => T,
  makeReal: () => T,
): () => T {
  let cached: T | undefined;
  resets.push(() => (cached = undefined));
  return () => {
    if (cached) return cached;
    const status = selectStatus();
    if (status.provider === "mock") {
      if (status.requested !== "mock") {
        logger.warn("provider_fallback", {
          integration,
          requested: status.requested,
          fallback: "mock",
          reason: "provider not configured (missing keys or not the scaffold-time choice)",
        });
      }
      cached = makeMock();
    } else {
      cached = makeReal();
    }
    return cached;
  };
}

/** Each getter: mock by default; the scaffold-time provider activates only when its keys are present. */
export const getPaymentProvider = memoizedProvider<PaymentProvider>(
  "payment",
  selectPaymentStatus,
  () => new MockPaymentProvider(),
  () => new RealPaymentProvider(),
);
export const getEmailProvider = memoizedProvider<EmailProvider>(
  "email",
  selectEmailStatus,
  () => new MockEmailProvider(),
  () => new RealEmailProvider(),
);
export const getStorageProvider = memoizedProvider<StorageProvider>(
  "storage",
  selectStorageStatus,
  () => new MockStorageProvider(),
  () => new RealStorageProvider(),
);

/** TEST ONLY: clear memoized singletons. */
export function resetProviders(): void {
  for (const reset of resets) reset();
}
