// A satellite orbiting a planet under Newtonian gravity, F = GMm/r².
// Integrated step by step (velocity Verlet), so too-slow or too-fast launches
// genuinely give ellipses, crashes or escapes. Pure functions, SI units.

import type { Params, SimEvent } from "@/lib/simkit/types";

export const G = 6.67e-11; // N m² kg⁻² (9702 data booklet value)
export const PLANET_RADIUS = 6.37e6; // m, an Earth-sized planet
/** Escape is declared once E ≥ 0 and the satellite is this many launch radii away. */
export const ESCAPE_DISTANCE_FACTOR = 10;

export interface OrbitState {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Total angle swept around the planet since launch (rad). */
  angle: number;
  /** Time the last full revolution was completed (launch counts as 0). */
  lastRevolution: number;
  /** Measured orbital period. Null until one full orbit is completed. */
  period: number | null;
}

export const circularSpeed = (r: number, M: number) => Math.sqrt((G * M) / r);

export function initialState(p: Params): OrbitState {
  return {
    t: 0,
    x: p.r,
    y: 0,
    vx: 0,
    vy: p.f * circularSpeed(p.r, p.M),
    angle: 0,
    lastRevolution: 0,
    period: null,
  };
}

export const radius = (s: OrbitState) => Math.hypot(s.x, s.y);
export const speed = (s: OrbitState) => Math.hypot(s.vx, s.vy);
/** Gravitational field strength at the satellite's position. */
export const fieldStrength = (s: OrbitState, p: Params) => (G * p.M) / radius(s) ** 2;

function accel(x: number, y: number, M: number) {
  const r = Math.hypot(x, y);
  const k = (-G * M) / (r * r * r);
  return { ax: k * x, ay: k * y };
}

export function step(s: OrbitState, p: Params, dt: number): OrbitState {
  const a0 = accel(s.x, s.y, p.M);
  const x = s.x + s.vx * dt + 0.5 * a0.ax * dt * dt;
  const y = s.y + s.vy * dt + 0.5 * a0.ay * dt * dt;
  const a1 = accel(x, y, p.M);
  const vx = s.vx + 0.5 * (a0.ax + a1.ax) * dt;
  const vy = s.vy + 0.5 * (a0.ay + a1.ay) * dt;
  const t = s.t + dt;

  // Accumulate the swept angle (unwrapped), then check for a completed revolution.
  let dTheta = Math.atan2(y, x) - Math.atan2(s.y, s.x);
  if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
  if (dTheta < -Math.PI) dTheta += 2 * Math.PI;
  const angle = s.angle + dTheta;

  let { lastRevolution, period } = s;
  const before = Math.floor(Math.abs(s.angle) / (2 * Math.PI));
  const after = Math.floor(Math.abs(angle) / (2 * Math.PI));
  if (after > before) {
    // Interpolate when the angle hit the exact multiple of 2π inside this step.
    const target = after * 2 * Math.PI;
    const frac = (target - Math.abs(s.angle)) / (Math.abs(angle) - Math.abs(s.angle));
    const tRev = s.t + frac * dt;
    period = tRev - lastRevolution;
    lastRevolution = tRev;
  }

  return { t, x, y, vx, vy, angle, lastRevolution, period };
}

/** Specific orbital energy (per kg of satellite): negative when bound. */
export function orbitEnergy(s: OrbitState, p: Params) {
  return 0.5 * speed(s) ** 2 - (G * p.M) / radius(s);
}

export function checkEvent(s: OrbitState, p: Params): SimEvent | null {
  const r = radius(s);
  if (r <= PLANET_RADIUS) {
    return {
      kind: "crashed",
      message:
        "The satellite crashed into the planet. It was launched slower than the circular orbit speed, so gravity pulled it into an ellipse that hit the surface.",
    };
  }
  if (orbitEnergy(s, p) >= 0 && r > ESCAPE_DISTANCE_FACTOR * p.r) {
    return {
      kind: "escaped",
      message:
        "The satellite escaped. Its kinetic energy was larger than the energy needed to climb out of the gravitational field (v ≥ √2 × circular speed), so it will never return.",
    };
  }
  return null;
}

/**
 * The conic section (ellipse, parabola or hyperbola) the satellite is currently on,
 * for drawing its path. Returns the semi-latus rectum, eccentricity and periapsis angle.
 */
export function orbitShape(s: OrbitState, p: Params) {
  const mu = G * p.M;
  const h = s.x * s.vy - s.y * s.vx; // specific angular momentum (z)
  const r = radius(s);
  const ex = (s.vy * h) / mu - s.x / r;
  const ey = (-s.vx * h) / mu - s.y / r;
  return { semiLatus: (h * h) / mu, e: Math.hypot(ex, ey), periapsisAngle: Math.atan2(ey, ex), clockwise: h < 0 };
}
