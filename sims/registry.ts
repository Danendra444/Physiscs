import type { AnySim, Topic } from "@/lib/simkit/types";
import { centripetalForce } from "./centripetal-force";
import { massSpring } from "./mass-spring";
import { satelliteOrbits } from "./satellite-orbits";

// To add a simulation: build it in sims/<slug>/ (copy sims/_template/), then add it here.

export const TOPICS: Topic[] = [
  {
    id: "circular-motion",
    number: 12,
    title: "Motion in a circle",
    level: "A2",
    summary: "Angular speed, centripetal acceleration and the force needed to keep something moving in a circle.",
  },
  {
    id: "gravitational-fields",
    number: 13,
    title: "Gravitational fields",
    level: "A2",
    summary: "Newton's law of gravitation, field strength and satellites in orbit.",
  },
  {
    id: "oscillations",
    number: 17,
    title: "Oscillations",
    level: "A2",
    summary: "Simple harmonic motion, energy in oscillations and damping.",
  },
];

export const SIMS: AnySim[] = [centripetalForce, satelliteOrbits, massSpring];

export const getSim = (slug: string) => SIMS.find((s) => s.slug === slug);
export const getTopic = (id: string) => TOPICS.find((t) => t.id === id);
export const simsForTopic = (topicId: string) => SIMS.filter((s) => s.topic === topicId);
