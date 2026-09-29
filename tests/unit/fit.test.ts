import { describe, expect, it } from "vitest";
import { linearFit } from "@/lib/simkit/fit";

describe("linearFit", () => {
  it("recovers an exact straight line", () => {
    const fit = linearFit([1, 2, 3, 4], [5, 7, 9, 11]);
    expect(fit).not.toBeNull();
    expect(fit!.gradient).toBeCloseTo(2, 10);
    expect(fit!.intercept).toBeCloseTo(3, 10);
    expect(fit!.r2).toBeCloseTo(1, 10);
  });

  it("finds the least-squares line through noisy data", () => {
    // y = 2x + 1 with symmetric noise: least squares should still give gradient 2.
    const fit = linearFit([0, 1, 2, 3], [1.1, 2.9, 5.1, 6.9]);
    expect(fit!.gradient).toBeCloseTo(1.96, 2);
    expect(fit!.intercept).toBeCloseTo(1.06, 2);
    expect(fit!.r2).toBeGreaterThan(0.99);
    expect(fit!.r2).toBeLessThan(1);
  });

  it("returns null with fewer than two points", () => {
    expect(linearFit([1], [2])).toBeNull();
    expect(linearFit([], [])).toBeNull();
  });

  it("returns null when every x is the same (vertical line)", () => {
    expect(linearFit([2, 2, 2], [1, 2, 3])).toBeNull();
  });

  it("returns null when arrays have different lengths", () => {
    expect(linearFit([1, 2, 3], [1, 2])).toBeNull();
  });

  it("gives r² = 1 for a horizontal line", () => {
    const fit = linearFit([1, 2, 3], [4, 4, 4]);
    expect(fit!.gradient).toBeCloseTo(0, 10);
    expect(fit!.r2).toBe(1);
  });
});
