// @app/integrations — mock-first third-party providers behind interfaces + the settlement choke-point.
// Concrete adapters (Stripe/MercadoPago/Resend/Supabase/S3) are internal: consume them through the
// factory getters or the Real* re-exports, which the scaffolder points at your chosen providers.
export type {
  PaymentProvider,
  EmailProvider,
  StorageProvider,
  CreateCheckoutInput,
  CreateCheckoutResult,
  ParsedWebhook,
  SendEmailInput,
  SendEmailResult,
  SignedUpload,
  SignedUrlOpts,
} from "./types";

export {
  getPaymentProvider,
  getEmailProvider,
  getStorageProvider,
  resetProviders,
} from "./factory";
export {
  selectPaymentStatus,
  selectEmailStatus,
  selectStorageStatus,
  type IntegrationStatus,
} from "./status";
export {
  settleOrder,
  type SettleOrderInput,
  type SettleOrderResult,
  type OrderRow,
} from "./settle";
export { OrderNotFoundError, ProviderConfigError, WebhookVerificationError } from "./errors";
export { logger } from "./logger";

export { MockPaymentProvider } from "./payment/mock";
export { RealPaymentProvider } from "./payment/real";
export { MockEmailProvider } from "./email/mock";
export { RealEmailProvider } from "./email/real";
export { MockStorageProvider } from "./storage/mock";
export { RealStorageProvider } from "./storage/real";
