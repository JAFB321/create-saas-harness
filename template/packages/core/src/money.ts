/**
 * Format an integer amount of minor units (cents) as a localized currency string.
 * Money is always stored and passed around as integer cents — never floats.
 */
export function formatMoney(cents: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format((cents ?? 0) / 100);
}
