import { requireUser } from "@/lib/auth";
import { createServerClient } from "@app/db";
import { getPlan, itemsRemaining } from "@app/core";
import { countItemsFor } from "@/lib/items";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const itemCount = await countItemsFor(supabase, user.id);

  const plan = getPlan(user.profile?.plan);
  const remaining = itemsRemaining(user.profile?.plan, itemCount);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-[var(--color-muted-foreground)]">{t("dashboard.plan")}</p>
          <p className="text-xl font-semibold">{plan.name}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted-foreground)]">{t("dashboard.items")}</p>
          <p className="text-xl font-semibold">{itemCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted-foreground)]">{t("dashboard.remaining")}</p>
          <p className="text-xl font-semibold">{remaining === null ? "∞" : remaining}</p>
        </Card>
      </div>
    </div>
  );
}
