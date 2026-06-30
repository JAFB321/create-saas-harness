import { describe, expect, it } from "vitest";
import { canCreateItem, itemsRemaining } from "./entitlements";

describe("entitlements", () => {
  it("free plan caps at 3 items", () => {
    expect(canCreateItem("free", 2)).toBe(true);
    expect(canCreateItem("free", 3)).toBe(false);
    expect(itemsRemaining("free", 2)).toBe(1);
  });

  it("business plan is unlimited", () => {
    expect(canCreateItem("business", 9999)).toBe(true);
    expect(itemsRemaining("business", 9999)).toBe(null);
  });

  it("defaults to free for unknown plan", () => {
    expect(canCreateItem(null, 3)).toBe(false);
  });
});
