import { NextResponse } from "next/server";
import { selectEmailStatus, selectPaymentStatus, selectStorageStatus } from "@app/integrations";

/** Liveness + which providers are effectively active (mock vs real). Handy in dev and uptime checks. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    providers: {
      payment: selectPaymentStatus(),
      email: selectEmailStatus(),
      storage: selectStorageStatus(),
    },
  });
}
