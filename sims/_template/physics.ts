// TEMPLATE: pure physics for your simulation. No React, no DOM, SI units.
// This example is a cart moving at constant velocity. Replace it with your model
// and write tests in tests/unit/<your-slug>.test.ts that compare it with the
// textbook formula (see tests/unit/mass-spring.test.ts for an example).

import type { Params } from "@/lib/simkit/types";

export interface TemplateState {
  t: number;
  x: number;
}

export function initialState(): TemplateState {
  return { t: 0, x: 0 };
}

export function step(s: TemplateState, p: Params, dt: number): TemplateState {
  return { t: s.t + dt, x: s.x + p.u * dt };
}
