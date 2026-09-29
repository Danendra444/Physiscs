export interface LinearFit {
  gradient: number;
  intercept: number;
  /** Coefficient of determination: 1 means every point lies on the line. */
  r2: number;
}

/** Least-squares straight line y = gradient·x + intercept. Returns null if no unique line exists. */
export function linearFit(xs: number[], ys: number[]): LinearFit | null {
  const n = xs.length;
  if (n < 2 || ys.length !== n) return null;

  const meanX = xs.reduce((s, x) => s + x, 0) / n;
  const meanY = ys.reduce((s, y) => s + y, 0) / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  if (sxx === 0) return null;

  const gradient = sxy / sxx;
  const intercept = meanY - gradient * meanX;
  if (syy === 0) return { gradient, intercept, r2: 1 };

  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const residual = ys[i] - (gradient * xs[i] + intercept);
    ssRes += residual * residual;
  }
  return { gradient, intercept, r2: 1 - ssRes / syy };
}
