import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@app/db";
import { formatMoney } from "@app/core";
import { selectPaymentStatus } from "@app/integrations";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SimulatePanel } from "./_components/simulate";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await requireUser();
  const { orderId } = await params;
  const db = createServiceClient();
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();

  // Service-role read bypasses RLS — enforce ownership here (404, don't leak existence).
  if (!order || order.user_id !== user.id) notFound();

  const isMock = selectPaymentStatus().provider === "mock";
  const devTools = process.env.DEV_TOOLS_ENABLED === "true";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6">
      <Card className="flex w-full flex-col gap-4">
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">Order {order.id.slice(0, 8)}</p>
          <p className="text-2xl font-semibold">{formatMoney(order.amount_cents, order.currency)}</p>
          <p className="mt-1 text-sm">
            Status: <strong>{order.status}</strong>
          </p>
        </div>

        {order.status === "paid" ? (
          <Link href="/dashboard">
            <Button className="w-full">Back to dashboard</Button>
          </Link>
        ) : isMock && devTools ? (
          <>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Mock checkout — no real provider configured. Simulate the outcome:
            </p>
            <SimulatePanel orderId={order.id} />
          </>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Waiting for the payment provider to confirm…
          </p>
        )}
      </Card>
    </main>
  );
}
