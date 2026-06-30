import { requireUser } from "@/lib/auth";
import { createServerClient } from "@app/db";
import { getPlan, itemsRemaining } from "@app/core";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const plan = getPlan(user.profile?.plan);
  const itemCount = count ?? 0;
  const remaining = itemsRemaining(user.profile?.plan, itemCount);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-[var(--color-muted-foreground)]">Plan</p>
          <p className="text-xl font-semibold">{plan.name}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted-foreground)]">Items</p>
          <p className="text-xl font-semibold">{itemCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted-foreground)]">Remaining</p>
          <p className="text-xl font-semibold">{remaining === null ? "∞" : remaining}</p>
        </Card>
      </div>
    </div>
  );
}
