import { describe, expect, it } from "vitest";
import { centripetalForce } from "@/sims/centripetal-force";
import { cut, initialState, step, type WhirlState } from "@/sims/centripetal-force/physics";

const DT = 1e-3;
const p = { m: 0.1, r: 0.5, v: 3 };

function run(s: WhirlState, seconds: number, each?: (s: WhirlState) => void) {
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    s = step(s, p, DT);
    each?.(s);
  }
  return s;
}

describe("centripetal force physics", () => {
  it("gives readouts matching the circular-motion formulas", () => {
    const r = centripetalForce.readouts(initialState(p), p);
    expect(r.F.value).toBeCloseTo((0.1 * 9) / 0.5, 10);
    expect(r.a.value).toBeCloseTo(9 / 0.5, 10);
    expect(r.omega.value).toBeCloseTo(3 / 0.5, 10);
    expect(r.T.value).toBeCloseTo((2 * Math.PI * 0.5) / 3, 10);
  });

  it("stays on the circle of radius r at speed v while attached", () => {
    run(initialState(p), 3, (s) => {
      expect(Math.hypot(s.x, s.y)).toBeCloseTo(0.5, 9);
      expect(Math.hypot(s.vx, s.vy)).toBeCloseTo(3, 9);
    });
  });

  it("completes one revolution in T = 2πr/v", () => {
    const T = (2 * Math.PI * 0.5) / 3;
    const s = run(initialState(p), T);
    expect(s.angle).toBeCloseTo(2 * Math.PI, 2);
  });

  it("moves in a straight line along the tangent after the string is cut", () => {
    const before = run(initialState(p), 0.37);
    const released = cut(before);
    // Velocity at release is perpendicular to the radius.
    expect(released.vx * released.x + released.vy * released.y).toBeCloseTo(0, 9);
    const later = run(released, 0.2);
    expect(later.vx).toBeCloseTo(released.vx, 12);
    expect(later.vy).toBeCloseTo(released.vy, 12);
    // Displacement is parallel to the release velocity.
    const dx = later.x - released.x;
    const dy = later.y - released.y;
    expect(dx * released.vy - dy * released.vx).toBeCloseTo(0, 9);
  });

  it("reports zero force after release and blocks recording", () => {
    const released = cut(initialState(p));
    expect(centripetalForce.readouts(released, p).F.value).toBe(0);
    expect(centripetalForce.recordBlocker!(released, p)).toMatch(/string/);
    expect(centripetalForce.recordBlocker!(initialState(p), p)).toBeNull();
  });

  it("ends with an event once the released bung has flown away", () => {
    const released = cut(initialState(p));
    const far = run(released, 1);
    expect(centripetalForce.events!(far, p)?.kind).toBe("flew-off");
    expect(centripetalForce.events!(initialState(p), p)).toBeNull();
  });
});
