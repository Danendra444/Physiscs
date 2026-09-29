// Horizontal mass–spring oscillator with optional linear damping:
//   m·a = −k·x − b·v
// Pure functions only: no React, no DOM. Units are SI throughout.

import type { Params } from "@/lib/simkit/types";

export interface SpringState {
  t: number;
  x: number;
  v: number;
  /** Times of the last two crossings of the equilibrium position (null until they happen). */
  lastCross: number | null;
  prevCross: number | null;
  /** Measured period: time between crossings two apart. Null until measured. */
  period: number | null;
}

export function initialState(p: Params): SpringState {
  return { t: 0, x: p.A, v: 0, lastCross: null, prevCross: null, period: null };
}

const acceleration = (x: number, v: number, p: Params) => (-p.k * x - p.b * v) / p.m;

/** One velocity-Verlet step (exact Verlet when b = 0; damping uses the half-step velocity). */
export function step(s: SpringState, p: Params, dt: number): SpringState {
  const a0 = acceleration(s.x, s.v, p);
  const x = s.x + s.v * dt + 0.5 * a0 * dt * dt;
  const vHalf = s.v + 0.5 * a0 * dt;
  const a1 = acceleration(x, vHalf, p);
  const v = vHalf + 0.5 * a1 * dt;
  const t = s.t + dt;

  let { lastCross, prevCross, period } = s;
  const crossed = (s.x > 0 && x <= 0) || (s.x < 0 && x >= 0);
  if (crossed) {
    // Interpolate the exact moment x = 0 inside this step.
    const tc = s.t + (dt * s.x) / (s.x - x);
    if (prevCross !== null) period = tc - prevCross;
    prevCross = lastCross;
    lastCross = tc;
  }

  return { t, x, v, lastCross, prevCross, period };
}

export function energy(s: SpringState, p: Params) {
  const kinetic = 0.5 * p.m * s.v * s.v;
  const potential = 0.5 * p.k * s.x * s.x;
  return { kinetic, potential, total: kinetic + potential };
}

export function accelerationOf(s: SpringState, p: Params) {
  return acceleration(s.x, s.v, p);
}
