// TEMPLATE: copy this folder to sims/<your-slug>/, rename things, then add your
// simulation to SIMS in sims/registry.ts. See CONTRIBUTING.md for the full guide.
import type { SimDefinition } from "@/lib/simkit/types";
import { activity, theory } from "./content";
import { initialState, step, type TemplateState } from "./physics";
import { render } from "./render";

export const templateSim: SimDefinition<TemplateState> = {
  slug: "template",
  title: "Template simulation",
  topic: "kinematics", // must match a topic id in sims/registry.ts
  summary: "One line for the topic page.",
  syllabusRefs: ["2.1"],
  params: [{ id: "u", label: "Velocity", symbol: "u", unit: "m s⁻¹", min: 0, max: 5, step: 0.1, default: 1, sf: 2 }],
  dt: 1e-3,
  timeScale: () => 1,
  initialState,
  step,
  readouts: (s) => ({ x: { label: "Displacement", symbol: "x", value: s.x, unit: "m", sf: 3 } }),
  recordable: ["x"],
  derivedColumns: [],
  render,
  canvasLabel: "Describe what the canvas shows for screen-reader users.",
  content: { theory, activity },
};
