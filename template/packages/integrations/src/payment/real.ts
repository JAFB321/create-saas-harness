// The "real" (non-mock) payment provider. The scaffolder rewrites this re-export to match the
// payments provider you chose, and prunes the other adapter file. Default: Stripe.
export { StripePaymentProvider as RealPaymentProvider } from "./stripe";
