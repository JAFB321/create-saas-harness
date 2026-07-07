/** Tiny className joiner (no dependency). Swap for clsx + tailwind-merge if you add shadcn. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Only same-origin paths: "/x" is fine, "//evil.com" is a protocol-relative open redirect. */
export function safeInternalPath(value: unknown, fallback = "/dashboard"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}
