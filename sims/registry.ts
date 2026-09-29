import type { AnySim, Topic } from "@/lib/simkit/types";
import { centripetalForce } from "./centripetal-force";
import { massSpring } from "./mass-spring";
import { satelliteOrbits } from "./satellite-orbits";

// To add a simulation: build it in sims/<slug>/ (copy sims/_template/), then add it here.

// The full 9702 syllabus. A topic is "available" once it has notes or a simulation;
// the rest show as "coming soon" on the home page and have no pages yet.
const defineTopic = (
  number: number,
  id: string,
  title: string,
  summary: string,
  hasNotes = false,
): Topic => ({ id, number, title, summary, level: number <= 11 ? "AS" : "A2", hasNotes });

export const TOPICS: Topic[] = [
  defineTopic(1, "physical-quantities", "Physical quantities and units", "SI units, prefixes, scalars and vectors, and uncertainties."),
  defineTopic(2, "kinematics", "Kinematics", "Displacement, velocity and acceleration, motion graphs and projectile motion."),
  defineTopic(3, "dynamics", "Dynamics", "Newton's laws, momentum and its conservation."),
  defineTopic(4, "forces", "Forces, density and pressure", "Types of force, moments, equilibrium, density and pressure."),
  defineTopic(5, "work-energy-power", "Work, energy and power", "Work done, kinetic and potential energy, conservation of energy and efficiency."),
  defineTopic(6, "deformation", "Deformation of solids", "Stretching materials, stress, strain and the Young modulus."),
  defineTopic(7, "waves", "Waves", "Wave properties, the Doppler effect, polarisation and the electromagnetic spectrum."),
  defineTopic(8, "superposition", "Superposition", "Stationary waves, diffraction, interference and diffraction gratings."),
  defineTopic(9, "electricity", "Electricity", "Charge, current, potential difference, resistance and electrical power."),
  defineTopic(10, "dc-circuits", "D.C. circuits", "Circuit laws, series and parallel circuits, and potential dividers."),
  defineTopic(11, "particle-physics", "Particle physics", "Atomic structure, quarks, leptons and the standard model."),
  defineTopic(12, "circular-motion", "Motion in a circle", "Angular speed, centripetal acceleration and the force needed to keep something moving in a circle.", true),
  defineTopic(13, "gravitational-fields", "Gravitational fields", "Newton's law of gravitation, field strength, potential and satellites in orbit.", true),
  defineTopic(14, "temperature", "Temperature", "Thermal equilibrium, temperature scales and specific heat capacity."),
  defineTopic(15, "ideal-gases", "Ideal gases", "The gas laws, the ideal gas equation and the kinetic theory of gases."),
  defineTopic(16, "thermodynamics", "Thermodynamics", "Internal energy and the first law of thermodynamics."),
  defineTopic(17, "oscillations", "Oscillations", "Simple harmonic motion, energy in oscillations, damping and resonance.", true),
  defineTopic(18, "electric-fields", "Electric fields", "Coulomb's law, electric field strength and potential."),
  defineTopic(19, "capacitance", "Capacitance", "Capacitors, energy stored and charging and discharging."),
  defineTopic(20, "magnetic-fields", "Magnetic fields", "Magnetic force, electromagnetic induction and Faraday's and Lenz's laws."),
  defineTopic(21, "alternating-currents", "Alternating currents", "Alternating voltages, transformers and rectification."),
  defineTopic(22, "quantum-physics", "Quantum physics", "Photons, the photoelectric effect and energy levels."),
  defineTopic(23, "nuclear-physics", "Nuclear physics", "Mass defect, binding energy and radioactive decay."),
  defineTopic(24, "medical-physics", "Medical physics", "Ultrasound, X-rays, CT scans and PET scans."),
  defineTopic(25, "astronomy", "Astronomy and cosmology", "Standard candles, the Hubble law and the Big Bang."),
];

export const SIMS: AnySim[] = [centripetalForce, satelliteOrbits, massSpring];

export const getSim = (slug: string) => SIMS.find((s) => s.slug === slug);
export const getTopic = (id: string) => TOPICS.find((t) => t.id === id);
export const simsForTopic = (topicId: string) => SIMS.filter((s) => s.topic === topicId);

/** A topic is available once it has notes or at least one simulation. */
export const isAvailable = (topic: Topic) => topic.hasNotes || simsForTopic(topic.id).length > 0;
export const availableTopics = () => TOPICS.filter(isAvailable);
