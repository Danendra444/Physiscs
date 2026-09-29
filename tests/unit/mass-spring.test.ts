import { describe, expect, it } from "vitest";
import { energy, initialState, step, type SpringState } from "@/sims/mass-spring/physics";

const DT = 2e-4;

function run(params: Record<string, number>, seconds: number, each?: (s: SpringState) => void): SpringState {
  let s = initialState(params);
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    s = step(s, params, DT);
    each?.(s);
  }
  return s;
}

const theoryT = (m: number, k: number) => 2 * Math.PI * Math.sqrt(m / k);

describe("mass–spring physics", () => {
  it.each([
    [0.5, 20],
    [0.1, 100],
    [2, 5],
  ])("measures T within 0.5%% of 2π√(m/k) for m=%s kg, k=%s N/m", (m, k) => {
    const s = run({ m, k, A: 0.1, b: 0 }, 3 * theoryT(m, k));
    expect(s.period).not.toBeNull();
    expect(Math.abs(s.period! - theoryT(m, k)) / theoryT(m, k)).toBeLessThan(0.005);
  });

  it("has no measured period before the first oscillations", () => {
    expect(initialState({ m: 0.5, k: 20, A: 0.1, b: 0 }).period).toBeNull();
  });

  it("conserves total energy within 0.1% over 20 periods with no damping", () => {
    const p = { m: 0.5, k: 20, A: 0.1, b: 0 };
    const e0 = energy(initialState(p), p).total;
    let worst = 0;
    run(p, 20 * theoryT(p.m, p.k), (s) => {
      worst = Math.max(worst, Math.abs(energy(s, p).total - e0) / e0);
    });
    expect(worst).toBeLessThan(0.001);
  });

  it("has a period independent of amplitude", () => {
    const small = run({ m: 0.5, k: 20, A: 0.03, b: 0 }, 4).period!;
    const large = run({ m: 0.5, k: 20, A: 0.2, b: 0 }, 4).period!;
    expect(Math.abs(small - large) / small).toBeLessThan(0.001);
  });

  it("starts at rest at the amplitude", () => {
    const s = initialState({ m: 0.5, k: 20, A: 0.12, b: 0 });
    expect(s.x).toBe(0.12);
    expect(s.v).toBe(0);
  });

  it("loses energy steadily when damped", () => {
    const p = { m: 0.5, k: 20, A: 0.1, b: 0.5 };
    let last = energy(initialState(p), p).total;
    let i = 0;
    run(p, 5, (s) => {
      if (++i % 100 !== 0) return;
      const e = energy(s, p).total;
      expect(e).toBeLessThanOrEqual(last + 1e-12);
      last = e;
    });
    expect(last).toBeLessThan(0.5 * energy(initialState(p), p).total);
  });
});
