"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Mock-only: posts a simulated webhook so you can exercise the settle loop without a real provider. */
export function SimulatePanel({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function simulate(status: "paid" | "failed") {
    setBusy(true);
    await fetch("/api/webhooks/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <Button disabled={busy} onClick={() => simulate("paid")}>
        Simulate paid
      </Button>
      <Button variant="secondary" disabled={busy} onClick={() => simulate("failed")}>
        Simulate failed
      </Button>
    </div>
  );
}
