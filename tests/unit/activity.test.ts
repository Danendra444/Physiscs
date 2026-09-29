import { describe, expect, it } from "vitest";
import { evaluateAnalyse, evaluateTask, gradeChoice } from "@/lib/simkit/activity";
import type { AnalyseStep, ExplainStep, Row } from "@/lib/simkit/types";

const rows = (vs: number[], extra: Partial<Row> = {}): Row[] =>
  vs.map((v) => ({ m: 0.5, r: 1, v, v2: v * v, F: (0.5 * v * v) / 1, ...extra }));

describe("evaluateTask", () => {
  it("fails with too few rows and says how many more are needed", () => {
    const res = evaluateTask({ minRows: 5 }, rows([1, 2, 3]));
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/2 more/);
  });

  it("passes with enough rows", () => {
    expect(evaluateTask({ minRows: 3 }, rows([1, 2, 3])).ok).toBe(true);
  });

  it("requires the varied column to have distinct values", () => {
    const res = evaluateTask({ minRows: 3, varyColumn: "v" }, rows([2, 2, 3]));
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/different values of v/);
    expect(evaluateTask({ minRows: 3, varyColumn: "v" }, rows([1, 2, 3])).ok).toBe(true);
  });

  it("requires held-constant columns to stay the same", () => {
    const mixed = [...rows([1, 2]), ...rows([3], { m: 0.8 })];
    const res = evaluateTask({ minRows: 3, holdConstant: ["m", "r"] }, mixed);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/keep m constant/);
  });
});

describe("evaluateAnalyse", () => {
  const step: AnalyseStep = {
    kind: "analyse",
    id: "a1",
    instruction: "",
    target: { x: "v2", y: "F" },
    expectedGradient: (rs) => rs[0].m / rs[0].r,
    gradientUnit: "kg/m",
    tolerancePct: 5,
    hint: "Try plotting against v².",
  };

  it("passes with the target axes and an accurate gradient", () => {
    const res = evaluateAnalyse(step, rows([1, 2, 3, 4]), { x: "v2", y: "F" });
    expect(res.ok).toBe(true);
    expect(res.fit!.gradient).toBeCloseTo(0.5, 6);
  });

  it("fails with the wrong axes and gives the hint", () => {
    const res = evaluateAnalyse(step, rows([1, 2, 3, 4]), { x: "v", y: "F" });
    expect(res.ok).toBe(false);
    expect(res.message).toContain("Try plotting against v².");
  });

  it("fails when the gradient is outside the tolerance", () => {
    const bad = rows([1, 2, 3, 4]).map((r) => ({ ...r, F: r.F * 1.2 }));
    const res = evaluateAnalyse(step, bad, { x: "v2", y: "F" });
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/gradient/i);
  });

  it("passes at just inside the tolerance boundary", () => {
    const edge = rows([1, 2, 3, 4]).map((r) => ({ ...r, F: r.F * 1.049 }));
    expect(evaluateAnalyse(step, edge, { x: "v2", y: "F" }).ok).toBe(true);
  });

  it("fails when there are not enough points to fit", () => {
    const res = evaluateAnalyse(step, rows([1]), { x: "v2", y: "F" });
    expect(res.ok).toBe(false);
    expect(res.fit).toBeNull();
  });
});

describe("gradeChoice", () => {
  const step: ExplainStep = {
    kind: "explain",
    id: "e1",
    question: "",
    options: ["a", "b", "c"],
    correctIndex: 1,
    feedbackCorrect: "",
    feedbackWrong: "",
    prompt: "",
  };

  it("marks the correct option", () => {
    expect(gradeChoice(step, 1)).toBe(true);
    expect(gradeChoice(step, 0)).toBe(false);
  });
});
