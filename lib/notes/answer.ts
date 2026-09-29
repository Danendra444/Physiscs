// Marking for numeric self-check questions. Students type only the number; the
// unit is shown next to the box, so we never have to guess what a typed unit meant.

const PLAIN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const TIMES_TEN = /^([+-]?(?:\d+\.?\d*|\.\d+))\s*[×x*]\s*10\s*\^\s*\{?\s*([+-]?\d+)\s*\}?$/;

/**
 * Read a number the way a student might type it: "1.5", "1,5" (decimal comma),
 * "3e8", "3×10^8", "6.67 x 10^-11". Returns null when it isn't a single number.
 */
export function parseNumber(text: string): number | null {
  let s = text.trim().replace(/−/g, "-");
  if (s === "") return null;

  // One comma and no dot means a decimal comma. Anything else with commas is ambiguous.
  const commas = (s.match(/,/g) ?? []).length;
  if (commas > 1 || (commas === 1 && s.includes("."))) return null;
  s = s.replace(",", ".");

  let value: number;
  const times = TIMES_TEN.exec(s);
  if (times) value = Number(times[1]) * 10 ** Number(times[2]);
  else if (PLAIN.test(s)) value = Number(s);
  else return null;

  return Number.isFinite(value) ? value : null;
}

export type NumericResult = "correct" | "wrong" | "invalid";

/** Mark a typed answer against the true value, within ± tolerancePct percent. */
export function checkNumeric(text: string, answer: number, tolerancePct: number): NumericResult {
  const value = parseNumber(text);
  if (value === null) return "invalid";
  const allowed = (Math.abs(answer) * tolerancePct) / 100;
  return Math.abs(value - answer) <= allowed * (1 + 1e-12) ? "correct" : "wrong";
}

export interface CheckState {
  correct: boolean;
  attempts: number;
}

/** The explanation opens after a correct answer or two attempts, so a stuck student still learns. */
export function revealsExplanation(state: CheckState | undefined): boolean {
  return state !== undefined && (state.correct || state.attempts >= 2);
}
