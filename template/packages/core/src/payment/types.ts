/** Lifecycle status of a one-time order. */
export type OrderStatus = "pending" | "paid" | "failed" | "expired";

/** A status a settlement event can move an order to. */
export type SettleStatus = "paid" | "failed" | "expired";

/** Coarse payment method (provider-agnostic). */
export type PaymentMethod = "card" | "cash" | "transfer" | "other";
