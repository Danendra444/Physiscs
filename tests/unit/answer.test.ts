import { describe, expect, it } from "vitest";
import { checkNumeric, parseNumber, revealsExplanation } from "@/lib/notes/answer";

describe("parseNumber", () => {
  it.each([
    ["1.5", 1.5],
    ["1,5", 1.5],
    ["-2", -2],
    ["−2", -2], // Unicode minus, as typed on some keyboards
    ["+3", 3],
    ["  4.7  ", 4.7],
    ["3e8", 3e8],
    ["6.67E-11", 6.67e-11],
    ["3×10^8", 3e8],
    ["3 × 10^8", 3e8],
    ["3x10^8", 3e8],
    ["3*10^8", 3e8],
    ["6.67 × 10^-11", 6.67e-11],
    ["6.67 × 10^−11", 6.67e-11],
    ["1.2×10^{4}", 1.2e4],
    [".5", 0.5],
    ["0", 0],
  ])("reads %j as %s", (text, value) => {
    expect(parseNumber(text)).toBeCloseTo(value, 12);
  });

  it.each([
    "",
    "   ",
    "abc",
    "1.2.3",
    "1,2,3",
    "1,000.5",
    "12 m",
    "5 rad/s",
    "--3",
    "3e",
    "e5",
    "3 x",
    "×10^3",
    "NaN",
    "Infinity",
    "1/2",
  ])("rejects %j", (text) => {
    expect(parseNumber(text)).toBeNull();
  });
});

describe("checkNumeric", () => {
  it("accepts an answer within the tolerance", () => {
    expect(checkNumeric("4.7", 4.712, 2)).toBe("correct");
    expect(checkNumeric("4.62", 4.712, 2)).toBe("correct");
  });

  it("rejects an answer outside the tolerance", () => {
    expect(checkNumeric("4.5", 4.712, 2)).toBe("wrong");
    expect(checkNumeric("4.9", 4.712, 2)).toBe("wrong");
  });

  it("does not accept the wrong sign", () => {
    expect(checkNumeric("-4.7", 4.712, 2)).toBe("wrong");
  });

  it("does not mark input that is not a number", () => {
    expect(checkNumeric("about 5", 4.712, 2)).toBe("invalid");
    expect(checkNumeric("", 4.712, 2)).toBe("invalid");
  });

  it("works with negative and very small answers", () => {
    expect(checkNumeric("-6.5e-11", -6.67e-11, 3)).toBe("correct");
    expect(checkNumeric("6.67e-11", -6.67e-11, 3)).toBe("wrong");
  });
});

describe("revealsExplanation", () => {
  it("shows the explanation after a correct answer or two attempts", () => {
    expect(revealsExplanation({ correct: true, attempts: 1 })).toBe(true);
    expect(revealsExplanation({ correct: false, attempts: 2 })).toBe(true);
    expect(revealsExplanation({ correct: false, attempts: 1 })).toBe(false);
    expect(revealsExplanation(undefined)).toBe(false);
  });
});
