// Decides which provider is effectively active, by inspecting env. "requested" is what the env
// selector asks for; "provider" is what will actually run — mock unless the requested provider is
// the one wired at scaffold time (see `<kind>/real.ts`) AND its keys are present. The factory uses
// these so the requested-vs-effective decision lives in one place (and powers /api/health).
import { REAL_PAYMENT_PROVIDER, isRealPaymentConfigured } from "./payment/real";
import { REAL_EMAIL_PROVIDER, isRealEmailConfigured } from "./email/real";
import { REAL_STORAGE_PROVIDER, isRealStorageConfigured } from "./storage/real";

export type IntegrationStatus = { requested: string; provider: string };

function select(
  requested: string,
  realName: string,
  realConfigured: () => boolean,
): IntegrationStatus {
  if (requested !== "mock" && requested === realName && realConfigured()) {
    return { requested, provider: realName };
  }
  return { requested, provider: "mock" };
}

export function selectPaymentStatus(): IntegrationStatus {
  return select(
    process.env.PAYMENTS_PROVIDER ?? "mock",
    REAL_PAYMENT_PROVIDER,
    isRealPaymentConfigured,
  );
}

export function selectEmailStatus(): IntegrationStatus {
  return select(process.env.EMAIL_PROVIDER ?? "mock", REAL_EMAIL_PROVIDER, isRealEmailConfigured);
}

export function selectStorageStatus(): IntegrationStatus {
  return select(
    process.env.STORAGE_PROVIDER ?? "mock",
    REAL_STORAGE_PROVIDER,
    isRealStorageConfigured,
  );
}
