// @app/integrations — mock-first third-party providers behind interfaces + the settlement choke-point.
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
  StorageObject,
} from "./types";

export {
  getPaymentProvider,
  getEmailProvider,
  getStorageProvider,
  resetProviders,
} from "./factory";
export { selectPaymentStatus, selectEmailStatus, selectStorageStatus } from "./status";
export { settleOrder, type SettleOrderInput, type SettleOrderResult, type OrderRow } from "./settle";
export { settleOrderInput } from "./schemas";
export { OrderNotFoundError, ProviderConfigError, WebhookVerificationError } from "./errors";
export { logger } from "./logger";

export { MockPaymentProvider } from "./payment/mock";
export { RealPaymentProvider } from "./payment/real";
export { MockEmailProvider } from "./email/mock";
export { ResendProvider } from "./email/resend";
export { MockStorageProvider } from "./storage/mock";
export { S3StorageProvider } from "./storage/s3";
