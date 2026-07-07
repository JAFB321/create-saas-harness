import { requireUser } from "@/lib/auth";
import { PLAN_IDS, PLANS, formatMoney, getPlan } from "@app/core";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startCheckoutAction } from "./_actions";

export default async function BillingPage() {
  const user = await requireUser();
  const current = getPlan(user.profile?.plan);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("billing.title")}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {t("billing.currentPlan")}: <strong>{current.name}</strong>
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_IDS.map((id) => {
          const plan = PLANS[id];
          const isCurrent = id === current.id;
          return (
            <Card key={id} className="flex flex-col gap-3">
              <div>
                <p className="text-lg font-semibold">{plan.name}</p>
                <p className="text-2xl font-bold">
                  {plan.priceCents === 0 ? t("billing.free") : formatMoney(plan.priceCents)}
                  {plan.priceCents > 0 && (
                    <span className="text-sm font-normal text-[var(--color-muted-foreground)]">
                      {t("billing.perMonth")}
                    </span>
                  )}
                </p>
              </div>
              <ul className="flex-1 space-y-1 text-sm text-[var(--color-muted-foreground)]">
                {plan.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <Button variant="secondary" disabled>
                  {t("billing.current")}
                </Button>
              ) : plan.priceCents === 0 ? (
                <Button variant="secondary" disabled>
                  —
                </Button>
              ) : (
                <form action={startCheckoutAction}>
                  <input type="hidden" name="plan" value={id} />
                  <Button type="submit" className="w-full">
                    {t("billing.upgrade")}
                  </Button>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
