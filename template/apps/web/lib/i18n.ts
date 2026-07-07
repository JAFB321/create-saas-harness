/**
 * Minimal i18n: UI strings live in keyed dictionaries (English default). This keeps the app
 * "i18n-ready" — add locales by extending `dictionaries` and resolving the active locale (cookie,
 * header, or subpath). Swap this for next-intl/next-i18next when you need plurals/routing.
 */
const en = {
  "app.name": "{{PROJECT_NAME}}",
  "nav.dashboard": "Dashboard",
  "nav.items": "Items",
  "nav.billing": "Billing",
  "nav.settings": "Settings",
  "nav.signout": "Sign out",
  "auth.login": "Log in",
  "auth.signup": "Sign up",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.fullName": "Full name",
  "auth.noAccount": "Don't have an account?",
  "auth.confirmEmail": "Check your inbox to confirm your email, then log in.",
  "auth.callbackError": "Sign-in link expired or invalid. Please log in again.",
  "auth.haveAccount": "Already have an account?",
  "landing.tagline": "The fastest way to ship your SaaS.",
  "landing.cta": "Get started",
  "landing.footnote": "Built with create-saas-harness · runs mock-first",
  "dashboard.title": "Dashboard",
  "dashboard.plan": "Plan",
  "dashboard.items": "Items",
  "dashboard.remaining": "Remaining",
  "items.title": "Items",
  "items.new": "New item",
  "items.newPlaceholder": "New item title",
  "items.add": "Add",
  "items.delete": "Delete",
  "items.empty": "No items yet. Create your first one.",
  "items.limitReached": "You've reached your plan's item limit. Upgrade to add more.",
  "billing.title": "Billing",
  "billing.currentPlan": "Current plan",
  "billing.upgrade": "Upgrade",
  "billing.free": "Free",
  "billing.perMonth": "/mo",
  "billing.current": "Current",
  "checkout.order": "Order",
  "checkout.status": "Status",
  "checkout.back": "Back to dashboard",
  "checkout.mockNotice": "Mock checkout — no real provider configured. Simulate the outcome:",
  "checkout.waiting": "Waiting for the payment provider to confirm…",
  "settings.title": "Settings",
} as const;

export type MessageKey = keyof typeof en;

const dictionaries = { en } as const;
export type Locale = keyof typeof dictionaries;

export function t(key: MessageKey, locale: Locale = "en"): string {
  return dictionaries[locale][key] ?? en[key] ?? key;
}
