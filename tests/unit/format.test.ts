import { describe, expect, it } from "vitest";
import { formatNumber, formatQuantity, toSigFigs } from "@/lib/simkit/format";

describe("toSigFigs", () => {
  it("rounds to the requested significant figures", () => {
    expect(toSigFigs(3.14159, 3)).toBe(3.14);
    expect(toSigFigs(0.0012345, 2)).toBe(0.0012);
    expect(toSigFigs(98765, 2)).toBe(99000);
    expect(toSigFigs(-2.555, 3)).toBe(-2.56);
  });

  it("leaves zero and non-finite values alone", () => {
    expect(toSigFigs(0, 3)).toBe(0);
    expect(Number.isNaN(toSigFigs(NaN, 3))).toBe(true);
    expect(toSigFigs(Infinity, 3)).toBe(Infinity);
  });
});

describe("formatNumber", () => {
  it("keeps trailing zeros that are significant", () => {
    expect(formatNumber(2, 3)).toBe("2.00");
    expect(formatNumber(0.5, 2)).toBe("0.50");
  });

  it("uses plain notation for everyday magnitudes", () => {
    expect(formatNumber(1234.5, 3)).toBe("1230");
    expect(formatNumber(0.00456, 3)).toBe("0.00456");
  });

  it("uses scientific notation for very large or very small values", () => {
    expect(formatNumber(3.986e14, 3)).toBe("3.99 × 10¹⁴");
    expect(formatNumber(6.67e-11, 3)).toBe("6.67 × 10⁻¹¹");
    expect(formatNumber(4.2e7, 2)).toBe("4.2 × 10⁷");
  });

  it("formats zero and non-finite values", () => {
    expect(formatNumber(0, 3)).toBe("0.00");
    expect(formatNumber(NaN, 3)).toBe("–");
  });
});

describe("formatQuantity", () => {
  it("joins value and unit", () => {
    expect(formatQuantity({ label: "Force", symbol: "F", value: 1.234, unit: "N", sf: 3 })).toBe("1.23 N");
  });

  it("omits the unit when there is none", () => {
    expect(formatQuantity({ label: "Ratio", symbol: "k", value: 2, unit: "", sf: 2 })).toBe("2.0");
  });
});
