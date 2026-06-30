import type { OrderStatus, SettleStatus } from "./types";

/**
 * PURE payment state machine (no I/O). Unit-tested.
 *
 * "paid always wins": an approved payment rescues the order even if a prior attempt left it
 * `failed`/`expired` (same checkout, an approved retry). The only truly immutable state is `paid`:
 *  - `pending`            -> `paid | failed | expired`
 *  - `failed | expired`   -> `paid` (rescue), but NOT between each other nor back to a terminal
 *  - `paid`               -> nothing (no downgrade; chargebacks/refunds reconcile separately)
 */
export function canSettle(current: OrderStatus, next: SettleStatus): boolean {
  return next === "paid" ? current !== "paid" : current === "pending";
}

/** Resulting status. If the transition is invalid, keep the current status (no-op). */
export function nextOrderStatus(current: OrderStatus, next: SettleStatus): OrderStatus {
  return canSettle(current, next) ? next : current;
}

/** True if the status is terminal (no further transitions). */
export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status !== "pending";
}
