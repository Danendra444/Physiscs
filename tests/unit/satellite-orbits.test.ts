import { describe, expect, it } from "vitest";
import {
  G,
  PLANET_RADIUS,
  checkEvent,
  initialState,
  orbitEnergy,
  radius,
  step,
  type OrbitState,
} from "@/sims/satellite-orbits/physics";

const DT = 2;
const EARTH = 5.97e24;
const theoryT = (r: number, M: number) => 2 * Math.PI * Math.sqrt(r ** 3 / (G * M));

function run(p: Record<string, number>, seconds: number, each?: (s: OrbitState) => boolean | void) {
  let s = initialState(p);
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    s = step(s, p, DT);
    if (each?.(s) === false) break;
  }
  return s;
}

describe("satellite orbit physics", () => {
  it.each([
    [7e6, EARTH],
    [2e7, EARTH],
    [4.22e7, EARTH],
    [2e7, 1e25],
  ])("measures T within 0.5%% of 2π√(r³/GM) for r=%s m, M=%s kg", (r, M) => {
    const p = { r, M, f: 1 };
    const s = run(p, 1.2 * theoryT(r, M));
    expect(s.period).not.toBeNull();
    expect(Math.abs(s.period! - theoryT(r, M)) / theoryT(r, M)).toBeLessThan(0.005);
  });

  it("keeps a circular orbit's radius within 0.5% over 10 orbits", () => {
    const p = { r: 2e7, M: EARTH, f: 1 };
    let worst = 0;
    run(p, 10 * theoryT(p.r, p.M), (s) => {
      worst = Math.max(worst, Math.abs(radius(s) - p.r) / p.r);
    });
    expect(worst).toBeLessThan(0.005);
  });

  it("conserves energy within 0.1% over 10 orbits", () => {
    const p = { r: 1e7, M: EARTH, f: 1.1 };
    const e0 = orbitEnergy(initialState(p), p);
    let worst = 0;
    run(p, 10 * theoryT(p.r, p.M) * 1.4, (s) => {
      worst = Math.max(worst, Math.abs((orbitEnergy(s, p) - e0) / e0));
    });
    expect(worst).toBeLessThan(0.001);
  });

  it("starts on the +x axis moving at f times the circular speed", () => {
    const s = initialState({ r: 2e7, M: EARTH, f: 1.2 });
    expect(s.x).toBe(2e7);
    expect(s.y).toBe(0);
    expect(s.vx).toBe(0);
    expect(s.vy).toBeCloseTo(1.2 * Math.sqrt((G * EARTH) / 2e7), 6);
  });

  it("crashes when launched too slowly", () => {
    const p = { r: 2e7, M: EARTH, f: 0.5 };
    let event = null;
    run(p, 1e5, (s) => {
      event = checkEvent(s, p);
      return event === null;
    });
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("crashed");
    expect(PLANET_RADIUS).toBeGreaterThan(6e6);
  });

  it("escapes when launched faster than escape speed", () => {
    const p = { r: 1e7, M: EARTH, f: 1.5 };
    let event = null;
    run(p, 1e6, (s) => {
      event = checkEvent(s, p);
      return event === null;
    });
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("escaped");
  });

  it("does not report an event for a stable orbit", () => {
    const p = { r: 2e7, M: EARTH, f: 1 };
    let event = null;
    run(p, 3 * theoryT(p.r, p.M), (s) => {
      event = checkEvent(s, p);
      return event === null;
    });
    expect(event).toBeNull();
  });
});
