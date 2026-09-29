import { linearFit, type LinearFit } from "./fit";
import { formatNumber } from "./format";
import type { AnalyseStep, Row, TaskCheck } from "./types";

export interface CheckResult {
  ok: boolean;
  message: string;
}

export interface AnalyseResult extends CheckResult {
  fit: LinearFit | null;
}

/** Column ids → human labels (e.g. "v2" → "v²") for feedback messages. */
export type Labels = Record<string, string>;

const label = (labels: Labels, id: string) => labels[id] ?? id;

export function evaluateTask(check: TaskCheck, rows: Row[], labels: Labels = {}): CheckResult {
  if (rows.length < check.minRows) {
    const missing = check.minRows - rows.length;
    return {
      ok: false,
      message: `Record ${missing} more reading${missing === 1 ? "" : "s"} (${rows.length} of ${check.minRows}).`,
    };
  }

  for (const id of check.holdConstant ?? []) {
    const values = new Set(rows.map((r) => r[id]));
    if (values.size > 1) {
      return {
        ok: false,
        message: `To make it a fair test, keep ${label(labels, id)} constant in every reading. Delete the odd rows or clear the table and start again.`,
      };
    }
  }

  if (check.varyColumn) {
    const distinct = new Set(rows.map((r) => r[check.varyColumn!])).size;
    if (distinct < check.minRows) {
      return {
        ok: false,
        message: `You need at least ${check.minRows} different values of ${label(labels, check.varyColumn)} (you have ${distinct}).`,
      };
    }
  }

  return { ok: true, message: "Nice, you have enough readings." };
}

export function evaluateAnalyse(
  step: AnalyseStep,
  rows: Row[],
  axes: { x: string; y: string },
  labels: Labels = {},
): AnalyseResult {
  const fit = linearFit(
    rows.map((r) => r[axes.x]),
    rows.map((r) => r[axes.y]),
  );
  if (!fit) {
    return { ok: false, fit, message: "Record at least 2 readings with different x-values to draw a best-fit line." };
  }

  if (axes.x !== step.target.x || axes.y !== step.target.y) {
    return {
      ok: false,
      fit,
      message: `A graph of ${label(labels, axes.y)} against ${label(labels, axes.x)} isn't the one that shows the relationship. ${step.hint}`,
    };
  }

  const expected = step.expectedGradient(rows);
  const diffPct = (Math.abs(fit.gradient - expected) / Math.abs(expected)) * 100;
  const shown = `${formatNumber(fit.gradient, 3)} ${step.gradientUnit}`;
  const theory = `${formatNumber(expected, 3)} ${step.gradientUnit}`;

  if (diffPct > step.tolerancePct) {
    return {
      ok: false,
      fit,
      message: `Your gradient is ${shown}, but theory predicts ${theory} (${diffPct.toFixed(1)}% off, more than ${step.tolerancePct}%). Check you kept the other variables constant.`,
    };
  }

  return {
    ok: true,
    fit,
    message: `Gradient = ${shown}. Theory predicts ${theory}, a ${diffPct.toFixed(1)}% difference.`,
  };
}

export function gradeChoice(step: { correctIndex: number }, chosen: number): boolean {
  return chosen === step.correctIndex;
}
