import { describe, expect, it } from "vitest";
import { canSettle, isTerminalOrderStatus, nextOrderStatus } from "./state-machine";

describe("payment state machine", () => {
  it("pending can move to any terminal", () => {
    expect(canSettle("pending", "paid")).toBe(true);
    expect(canSettle("pending", "failed")).toBe(true);
    expect(canSettle("pending", "expired")).toBe(true);
  });

  it("paid is immutable", () => {
    expect(canSettle("paid", "paid")).toBe(false);
    expect(canSettle("paid", "failed")).toBe(false);
    expect(canSettle("paid", "expired")).toBe(false);
  });

  it("paid always wins: rescues failed/expired", () => {
    expect(canSettle("failed", "paid")).toBe(true);
    expect(canSettle("expired", "paid")).toBe(true);
    expect(nextOrderStatus("failed", "paid")).toBe("paid");
  });

  it("does not degrade terminals other than to paid", () => {
    expect(canSettle("failed", "expired")).toBe(false);
    expect(canSettle("expired", "failed")).toBe(false);
    expect(nextOrderStatus("failed", "expired")).toBe("failed");
  });

  it("isTerminalOrderStatus", () => {
    expect(isTerminalOrderStatus("pending")).toBe(false);
    expect(isTerminalOrderStatus("paid")).toBe(true);
    expect(isTerminalOrderStatus("failed")).toBe(true);
  });
});
