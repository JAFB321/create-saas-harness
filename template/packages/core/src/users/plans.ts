/**
 * Subscription plans / tiers. This is a NEUTRAL starting catalog — `/project-setup` and the roadmap
 * will adapt the plans, prices, and limits to your product's business model
 * (see FOUNDATIONS/05-business-model.md).
 */
export type Plan = "free" | "pro" | "business";

export interface PlanDef {
  id: Plan;
  name: string;
  /** Monthly price in minor units (cents). 0 = free. */
  priceCents: number;
  /** Hard limit on the example resource ("items"). null = unlimited. */
  itemLimit: number | null;
  features: string[];
}

export const PLANS: Record<Plan, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    priceCents: 0,
    itemLimit: 3,
    features: ["Up to 3 items", "Community support"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 1500,
    itemLimit: 100,
    features: ["Up to 100 items", "Email support", "Priority features"],
  },
  business: {
    id: "business",
    name: "Business",
    priceCents: 4900,
    itemLimit: null,
    features: ["Unlimited items", "Priority support", "Advanced controls"],
  },
};

export const PLAN_IDS = Object.keys(PLANS) as Plan[];

export function getPlan(plan: string | null | undefined): PlanDef {
  return PLANS[(plan as Plan) ?? "free"] ?? PLANS.free;
}
