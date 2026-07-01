// The "real" (non-mock) email provider, selected at scaffold time. Default: Resend.
// The scaffolder repoints this re-export (or pins it to the mock if you chose "none").
export {
  ResendProvider as RealEmailProvider,
  PROVIDER_NAME as REAL_EMAIL_PROVIDER,
  isConfigured as isRealEmailConfigured,
} from "./resend";
