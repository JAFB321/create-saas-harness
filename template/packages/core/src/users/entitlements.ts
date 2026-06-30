import { getPlan, type Plan } from "./plans";

/**
 * Pure entitlement checks — no I/O. The server passes the user's current plan and usage; this
 * decides what they're allowed to do. Keep all gating logic here so it's unit-testable.
 */
export function canCreateItem(plan: Plan | null | undefined, currentItemCount: number): boolean {
  const limit = getPlan(plan).itemLimit;
  return limit === null || currentItemCount < limit;
}

export function itemsRemaining(
  plan: Plan | null | undefined,
  currentItemCount: number,
): number | null {
  const limit = getPlan(plan).itemLimit;
  if (limit === null) return null; // unlimited
  return Math.max(0, limit - currentItemCount);
}
