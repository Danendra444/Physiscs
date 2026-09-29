import type { SimDefinition } from "@/lib/simkit/types";
import { activity, theory } from "./content";
import { accelerationOf, energy, initialState, step, type SpringState } from "./physics";
import { render } from "./render";

export const massSpring: SimDefinition<SpringState> = {
  slug: "mass-spring",
  title: "Mass–spring oscillator",
  topic: "oscillations",
  summary: "Discover what sets the period of an oscillating mass, and watch energy move between kinetic and potential.",
  syllabusRefs: ["17.1", "17.2", "17.3"],
  params: [
    { id: "m", label: "Mass", symbol: "m", unit: "kg", min: 0.1, max: 2, step: 0.05, default: 0.5, sf: 3 },
    { id: "k", label: "Spring constant", symbol: "k", unit: "N m⁻¹", min: 5, max: 100, step: 1, default: 20, sf: 3 },
    { id: "A", label: "Amplitude", symbol: "A", unit: "m", min: 0.02, max: 0.2, step: 0.01, default: 0.1, sf: 2 },
    { id: "b", label: "Damping", symbol: "b", unit: "kg s⁻¹", min: 0, max: 5, step: 0.1, default: 0, sf: 2 },
  ],
  toggles: [
    { id: "velocity", label: "Velocity arrow", default: true },
    { id: "acceleration", label: "Acceleration arrow", default: false },
  ],
  dt: 2e-4,
  timeScale: () => 1,
  initialState,
  step,
  readouts: (s, p) => {
    const e = energy(s, p);
    return {
      x: { label: "Displacement", symbol: "x", value: s.x, unit: "m", sf: 3 },
      v: { label: "Velocity", symbol: "v", value: s.v, unit: "m s⁻¹", sf: 3 },
      a: { label: "Acceleration", symbol: "a", value: accelerationOf(s, p), unit: "m s⁻²", sf: 3 },
      T: { label: "Period (measured)", symbol: "T", value: s.period ?? NaN, unit: "s", sf: 3 },
      KE: { label: "Kinetic energy", symbol: "Eₖ", value: e.kinetic, unit: "J", sf: 3 },
      PE: { label: "Potential energy", symbol: "Eₚ", value: e.potential, unit: "J", sf: 3 },
      E: { label: "Total energy", symbol: "E", value: e.total, unit: "J", sf: 3 },
    };
  },
  recordable: ["T"],
  derivedColumns: [
    { id: "T2", label: "T²", unit: "s²", compute: (r) => r.T * r.T },
    { id: "sqrtm", label: "√m", unit: "kg½", compute: (r) => Math.sqrt(r.m) },
  ],
  render,
  canvasLabel:
    "A block on a horizontal surface attached to a spring fixed to a wall on the left. The block oscillates about the equilibrium line x = 0 between −A and +A.",
  liveSeries: [
    {
      id: "x",
      title: "Displacement–time",
      yLabel: "x / m",
      series: [{ id: "x", label: "x", color: "accent" }],
      sample: (s) => ({ t: s.t, values: { x: s.x } }),
    },
    {
      id: "v",
      title: "Velocity–time",
      yLabel: "v / m s⁻¹",
      series: [{ id: "v", label: "v", color: "accent3" }],
      sample: (s) => ({ t: s.t, values: { v: s.v } }),
    },
    {
      id: "a",
      title: "Acceleration–time",
      yLabel: "a / m s⁻²",
      series: [{ id: "a", label: "a", color: "accent2" }],
      sample: (s, p) => ({ t: s.t, values: { a: accelerationOf(s, p) } }),
    },
    {
      id: "energy",
      title: "Energy–time",
      yLabel: "E / J",
      series: [
        { id: "KE", label: "Kinetic", color: "accent3" },
        { id: "PE", label: "Potential", color: "accent2" },
        { id: "E", label: "Total", color: "fg" },
      ],
      sample: (s, p) => {
        const e = energy(s, p);
        return { t: s.t, values: { KE: e.kinetic, PE: e.potential, E: e.total } };
      },
    },
  ],
  content: { theory, activity },
};
