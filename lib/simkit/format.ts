import type { Quantity } from "./types";

/**
 * Round to `sf` significant figures, half away from zero (the way students round by hand).
 * A tiny relative nudge stops values like 2.555 (stored as 2.55499999…) rounding down.
 */
export function toSigFigs(value: number, sf: number): number {
  if (!Number.isFinite(value) || value === 0) return value;
  const sign = Math.sign(value);
  const abs = Math.abs(value);
  const power = sf - 1 - Math.floor(Math.log10(abs));
  const nudged = abs * (1 + Number.EPSILON * 4);
  const rounded =
    power >= 0
      ? Math.round(nudged * 10 ** power) / 10 ** power
      : Math.round(nudged / 10 ** -power) * 10 ** -power;
  return sign * Number(rounded.toPrecision(15));
}

const SUPERSCRIPT: Record<string, string> = {
  "-": "⁻",
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};

function superscript(n: number): string {
  return String(n)
    .split("")
    .map((c) => SUPERSCRIPT[c] ?? c)
    .join("");
}

/** Format a number to `sf` significant figures, switching to "a × 10ⁿ" for very large or small values. */
export function formatNumber(value: number, sf: number): string {
  if (!Number.isFinite(value)) return "–";
  if (value === 0) return (0).toFixed(Math.max(0, sf - 1));
  const rounded = toSigFigs(value, sf);
  const exponent = Math.floor(Math.log10(Math.abs(rounded)));
  if (exponent >= 6 || exponent <= -4) {
    const mantissa = rounded / 10 ** exponent;
    return `${mantissa.toFixed(Math.max(0, sf - 1))} × 10${superscript(exponent)}`;
  }
  return rounded.toFixed(Math.max(0, sf - 1 - exponent));
}

export function formatQuantity(q: Quantity): string {
  const n = formatNumber(q.value, q.sf);
  return q.unit ? `${n} ${q.unit}` : n;
}
