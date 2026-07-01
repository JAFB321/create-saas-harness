// The "real" (non-mock) payment provider, selected at scaffold time. Default: Stripe.
// The scaffolder repoints this re-export and prunes the other adapter (and its SDK dependency).
export {
  StripePaymentProvider as RealPaymentProvider,
  PROVIDER_NAME as REAL_PAYMENT_PROVIDER,
  isConfigured as isRealPaymentConfigured,
} from "./stripe";
