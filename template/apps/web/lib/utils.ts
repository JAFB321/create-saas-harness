/** Tiny className joiner (no dependency). Swap for clsx + tailwind-merge if you add shadcn. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
