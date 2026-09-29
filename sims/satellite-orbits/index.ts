import type { SimDefinition } from "@/lib/simkit/types";
import { activity, theory } from "./content";
import { checkEvent, fieldStrength, initialState, radius, speed, step, type OrbitState } from "./physics";
import { render } from "./render";

/** Simulated seconds per real second: about 2.2 hours of orbit per second on screen. */
const TIME_SCALE = 8000;

export const satelliteOrbits: SimDefinition<OrbitState> = {
  slug: "satellite-orbits",
  title: "Satellite orbits",
  topic: "gravitational-fields",
  summary: "Launch satellites around a planet, discover Kepler's third law and find the geostationary orbit.",
  syllabusRefs: ["13.2", "13.3"],
  params: [
    { id: "r", label: "Orbit radius", symbol: "r", unit: "m", min: 7e6, max: 5e7, step: 1e5, default: 2e7, sf: 3 },
    { id: "M", label: "Planet mass", symbol: "M", unit: "kg", min: 1e24, max: 1e25, step: 1e22, default: 5.97e24, sf: 3 },
    { id: "f", label: "Launch speed ÷ circular speed", symbol: "f", unit: "", min: 0.5, max: 1.5, step: 0.01, default: 1, sf: 3 },
  ],
  toggles: [
    { id: "velocity", label: "Velocity arrow", default: true },
    { id: "force", label: "Gravitational force arrow", default: true },
    { id: "radius", label: "Radius line", default: false },
  ],
  dt: 2,
  timeScale: () => TIME_SCALE,
  initialState,
  step,
  readouts: (s, p) => ({
    T: { label: "Period (measured)", symbol: "T", value: s.period ?? NaN, unit: "s", sf: 3 },
    dist: { label: "Distance from centre", symbol: "r", value: radius(s), unit: "m", sf: 3 },
    v: { label: "Speed", symbol: "v", value: speed(s), unit: "m s⁻¹", sf: 3 },
    g: { label: "Field strength", symbol: "g", value: fieldStrength(s, p), unit: "N kg⁻¹", sf: 3 },
    hours: { label: "Time elapsed", symbol: "t", value: s.t / 3600, unit: "h", sf: 3 },
  }),
  recordable: ["T"],
  derivedColumns: [
    { id: "T2", label: "T²", unit: "s²", compute: (r) => r.T * r.T },
    { id: "r3", label: "r³", unit: "m³", compute: (r) => r.r ** 3 },
  ],
  events: checkEvent,
  render,
  canvasLabel:
    "A planet at the centre with a satellite orbiting it. A grey line shows the satellite's predicted path; arrows show its velocity and the gravitational force towards the planet.",
  content: { theory, activity },
};
