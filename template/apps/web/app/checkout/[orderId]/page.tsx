import Link from "next/link";
import { createServiceClient } from "@app/db";
import { formatMoney } from "@app/core";
import { selectPaymentStatus } from "@app/integrations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SimulatePanel } from "./_components/simulate";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const db = createServiceClient();
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();

  if (!order) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
        <Card>Order not found.</Card>
      </main>
    );
  }

  const isMock = selectPaymentStatus().provider === "mock";

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
        ) : isMock ? (
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
