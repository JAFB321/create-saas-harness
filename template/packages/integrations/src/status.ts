// Decides which provider is actually active, by inspecting env. The factory uses these so the
// "requested vs effective" decision lives in one place (and powers a /health probe).

export type PaymentStatus = { requested: string; provider: "stripe" | "mercadopago" | "mock" };
export type EmailStatus = { requested: string; provider: "resend" | "mock" };
export type StorageStatus = { requested: string; provider: "s3" | "mock" };

export function selectPaymentStatus(): PaymentStatus {
  const requested = process.env.PAYMENTS_PROVIDER ?? "mock";
  if (requested === "stripe" && process.env.STRIPE_SECRET_KEY) {
    return { requested, provider: "stripe" };
  }
  if (requested === "mercadopago" && process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return { requested, provider: "mercadopago" };
  }
  return { requested, provider: "mock" };
}

export function selectEmailStatus(): EmailStatus {
  const requested = process.env.EMAIL_PROVIDER ?? "mock";
  if (requested === "resend" && process.env.RESEND_API_KEY) {
    return { requested, provider: "resend" };
  }
  return { requested, provider: "mock" };
}

export function selectStorageStatus(): StorageStatus {
  const requested = process.env.STORAGE_PROVIDER ?? "mock";
  if (requested === "s3" && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID) {
    return { requested, provider: "s3" };
  }
  return { requested, provider: "mock" };
}
