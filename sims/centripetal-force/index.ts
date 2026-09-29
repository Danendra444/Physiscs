import type { SimDefinition } from "@/lib/simkit/types";
import { activity, theory } from "./content";
import { cut, initialState, step, type WhirlState } from "./physics";
import { render } from "./render";

/** Once released, the event fires when the bung is this far from the centre (m): off-screen at any radius. */
const FLY_OFF_DISTANCE = 2;

export const centripetalForce: SimDefinition<WhirlState> = {
  slug: "centripetal-force",
  title: "Centripetal force: whirling bung",
  topic: "circular-motion",
  summary: "Whirl a bung on a string, find how the force depends on speed, and see what happens when the string is cut.",
  syllabusRefs: ["12.1", "12.2"],
  params: [
    { id: "m", label: "Mass of bung", symbol: "m", unit: "kg", min: 0.05, max: 0.5, step: 0.01, default: 0.1, sf: 3 },
    { id: "r", label: "Radius", symbol: "r", unit: "m", min: 0.2, max: 1, step: 0.05, default: 0.5, sf: 2 },
    { id: "v", label: "Speed", symbol: "v", unit: "m s⁻¹", min: 1, max: 8, step: 0.1, default: 3, sf: 2 },
  ],
  toggles: [
    { id: "velocity", label: "Velocity arrow", default: true },
    { id: "acceleration", label: "Acceleration arrow", default: true },
  ],
  actions: [{ id: "cut", label: "Cut string" }],
  dt: 1e-3,
  timeScale: () => 1,
  initialState,
  step,
  readouts: (s, p) => {
    const attached = !s.released;
    return {
      F: { label: "Centripetal force (tension)", symbol: "F", value: attached ? (p.m * p.v ** 2) / p.r : 0, unit: "N", sf: 3 },
      a: { label: "Centripetal acceleration", symbol: "a", value: attached ? p.v ** 2 / p.r : 0, unit: "m s⁻²", sf: 3 },
      omega: { label: "Angular speed", symbol: "ω", value: attached ? p.v / p.r : 0, unit: "rad s⁻¹", sf: 3 },
      T: { label: "Period", symbol: "T", value: (2 * Math.PI * p.r) / p.v, unit: "s", sf: 3 },
    };
  },
  recordable: ["F", "omega", "T"],
  derivedColumns: [
    { id: "v2", label: "v²", unit: "m² s⁻²", compute: (r) => r.v * r.v },
    { id: "omega2", label: "ω²", unit: "rad² s⁻²", compute: (r) => r.omega * r.omega },
    { id: "invr", label: "1/r", unit: "m⁻¹", compute: (r) => 1 / r.r },
  ],
  events: (s) =>
    s.released && Math.hypot(s.x, s.y) > FLY_OFF_DISTANCE
      ? {
          kind: "flew-off",
          message:
            "The bung flew off in a straight line along the tangent. Without the string there is no centripetal force, so nothing changes its direction. Press Reset to reattach it.",
        }
      : null,
  recordBlocker: (s) => (s.released ? "The string is cut, so there is no centripetal force to measure. Press Reset first." : null),
  applyAction: (id, s) => (id === "cut" ? cut(s) : s),
  render,
  canvasLabel:
    "View from above of a bung whirling anticlockwise on a string around a central point. Arrows show its velocity along the tangent and its acceleration towards the centre.",
  content: { theory, activity },
};
