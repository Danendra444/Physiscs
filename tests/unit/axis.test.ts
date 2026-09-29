import { describe, expect, it } from "vitest";
import { axisFor, niceTicks } from "@/lib/simkit/axis";

describe("niceTicks", () => {
  it("chooses round steps covering the range", () => {
    expect(niceTicks(0, 10, 5)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(niceTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(niceTicks(0, 37, 5)).toEqual([0, 10, 20, 30, 40]);
  });

  it("handles negative ranges", () => {
    expect(niceTicks(-1, 1, 4)).toEqual([-1, -0.5, 0, 0.5, 1]);
  });
});

describe("axisFor", () => {
  it("includes the origin so students can see whether the line goes through it", () => {
    const a = axisFor([2, 3, 5]);
    expect(a.min).toBe(0);
    expect(a.max).toBeGreaterThanOrEqual(5);
    expect(a.exponent).toBe(0);
  });

  it("uses a power-of-ten factor for very large values", () => {
    const a = axisFor([1e21, 5e22, 1.2e23]);
    expect(a.exponent).toBe(23);
    expect(a.ticks.every((t) => Number.isFinite(t))).toBe(true);
  });

  it("uses a power-of-ten factor for very small values", () => {
    expect(axisFor([0.0001, 0.0004]).exponent).toBe(-4);
  });

  it("copes with empty data or all zeros", () => {
    expect(axisFor([]).max).toBeGreaterThan(0);
    expect(axisFor([0, 0]).max).toBeGreaterThan(0);
  });
});
