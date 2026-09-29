/** Round tick values ("1, 2, 5 × 10ⁿ" steps) spanning [min, max]. */
export function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min;
  if (!(span > 0)) return [min];
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const start = Math.floor(min / step + 1e-9) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-9; v += step) ticks.push(Number(v.toPrecision(12)));
  if (ticks[ticks.length - 1] < max - step * 1e-9) ticks.push(Number((start + ticks.length * step).toPrecision(12)));
  return ticks;
}

export interface Axis {
  min: number;
  max: number;
  ticks: number[];
  /** Values are shown divided by 10^exponent, with the factor in the axis label (Cambridge style). */
  exponent: number;
}

/** An axis for the data graph. It always includes zero, so students can judge "through the origin". */
export function axisFor(values: number[], tickCount = 5): Axis {
  const finite = values.filter(Number.isFinite);
  let lo = Math.min(0, ...finite);
  let hi = Math.max(0, ...finite);
  if (hi === lo) hi = lo + 1;
  const pad = (hi - lo) * 0.05;
  if (lo < 0) lo -= pad;
  hi += pad;

  const ticks = niceTicks(lo, hi, tickCount);
  const maxAbs = Math.max(Math.abs(ticks[0]), Math.abs(ticks[ticks.length - 1]));
  const e = maxAbs > 0 ? Math.floor(Math.log10(maxAbs)) : 0;
  const exponent = e >= 4 || e <= -3 ? e : 0;
  return { min: ticks[0], max: ticks[ticks.length - 1], ticks, exponent };
}
