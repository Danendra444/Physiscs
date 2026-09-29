// A rubber bung whirled in a horizontal circle on a string (viewed from above).
// While attached it moves uniformly around a circle of radius r at speed v;
// after the string is cut there is no resultant force, so it moves in a straight line.

import type { Params } from "@/lib/simkit/types";

export interface WhirlState {
  t: number;
  /** Angle swept since the start (rad), anticlockwise from +x. */
  angle: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  released: boolean;
}

export function initialState(p: Params): WhirlState {
  return { t: 0, angle: 0, x: p.r, y: 0, vx: 0, vy: p.v, released: false };
}

export function step(s: WhirlState, p: Params, dt: number): WhirlState {
  const t = s.t + dt;
  if (s.released) {
    return { ...s, t, x: s.x + s.vx * dt, y: s.y + s.vy * dt };
  }
  const angle = s.angle + (p.v / p.r) * dt;
  return {
    t,
    angle,
    x: p.r * Math.cos(angle),
    y: p.r * Math.sin(angle),
    vx: -p.v * Math.sin(angle),
    vy: p.v * Math.cos(angle),
    released: false,
  };
}

/** Cut the string: the bung keeps its current velocity. */
export function cut(s: WhirlState): WhirlState {
  return { ...s, released: true };
}
