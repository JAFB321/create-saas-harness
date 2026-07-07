import type { EmailTemplate, PaymentMethod } from "@app/core";

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export interface CreateCheckoutInput {
  orderId: string;
  amountCents: number;
  currency: string;
  /** Human description of what's being paid for (shown by some providers). */
  description?: string;
  /** Where to send the user after success/cancel. Defaults derived from APP_BASE_URL. */
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
}

export interface CreateCheckoutResult {
  checkoutId: string;
  /** URL to redirect the user to in order to pay. */
  redirectUrl?: string;
}

export interface ParsedWebhook {
  orderId: string;
  status: "paid" | "failed" | "expired";
  providerRef: string;
  method: PaymentMethod;
  /** Processing fee in cents if the provider reported it, else null (never overwrites with null). */
  feeCents: number | null;
}

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  /**
   * Verify + parse an incoming webhook into a normalized settlement intent.
   * Returns null for verified-but-ignorable events (unhandled types, async-pending);
   * throws WebhookVerificationError when verification fails.
   */
  parseWebhook(req: Request): Promise<ParsedWebhook | null>;
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------
export interface SendEmailInput {
  to: string;
  template: EmailTemplate;
  vars: Record<string, string>;
}

export interface SendEmailResult {
  messageId: string;
  status: "sent" | "failed";
}

export interface EmailProvider {
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}

// ---------------------------------------------------------------------------
// Storage (paths are canonical "<bucket>/<key>")
// ---------------------------------------------------------------------------
export interface SignedUpload {
  /** Canonical path "<bucket>/<key>" the server decided (the client never picks it). */
  path: string;
  /** Signed URL for a direct PUT from the browser (bytes never pass through the server). */
  signedUrl: string;
}

export interface SignedUrlOpts {
  /** Force `Content-Disposition: attachment; filename="<safe>"`. */
  downloadFilename?: string;
  contentType?: string;
}

/** The minimal private-file surface. Add stat/list/etc. on your adapter when a feature needs them. */
export interface StorageProvider {
  /** Signed URL to upload (PUT) an object to "<bucket>/<key>" directly from the browser. */
  createSignedUploadUrl(
    key: string,
    contentType?: string,
    ttlSeconds?: number,
  ): Promise<SignedUpload>;
  /** Write/overwrite bytes at an exact "<bucket>/<key>" (server-side). */
  putObject(path: string, buf: Buffer, contentType: string): Promise<void>;
  /** Download an object at "<bucket>/<key>" as a Buffer. */
  downloadObject(path: string): Promise<Buffer>;
  /** Signed GET URL for "<bucket>/<key>" with TTL. */
  signedUrl(path: string, ttlSeconds: number, opts?: SignedUrlOpts): Promise<string>;
  /** Delete an object. Idempotent (no throw if missing). */
  deleteObject(path: string): Promise<void>;
}
