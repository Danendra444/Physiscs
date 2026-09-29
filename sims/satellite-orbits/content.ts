import type { ActivityDefinition, TheoryContent } from "@/lib/simkit/types";
import { G } from "./physics";

export const theory: TheoryContent = {
  summary:
    "For a satellite in a circular orbit, the gravitational force from the planet provides exactly the centripetal force needed to keep it moving in a circle.",
  equations: [
    { tex: "F = \\dfrac{GMm}{r^2}", caption: "Newton's law of gravitation" },
    { tex: "g = \\dfrac{GM}{r^2}", caption: "Gravitational field strength of a point mass" },
    { tex: "\\dfrac{GMm}{r^2} = \\dfrac{mv^2}{r} \\;\\Rightarrow\\; v = \\sqrt{\\dfrac{GM}{r}}", caption: "Orbital speed" },
    { tex: "T^2 = \\dfrac{4\\pi^2}{GM}\\, r^3", caption: "Kepler's third law" },
  ],
  sections: [
    {
      heading: "Deriving Kepler's third law",
      body: "Set the gravitational force equal to the centripetal force: $\\frac{GMm}{r^2} = m\\omega^2 r$. With $\\omega = \\frac{2\\pi}{T}$ this gives $T^2 = \\frac{4\\pi^2}{GM} r^3$. The satellite's own mass $m$ cancels, so it doesn't affect the orbit.",
    },
    {
      heading: "Geostationary orbits",
      body: "A geostationary satellite orbits above the equator, in the same direction as the Earth rotates, with a period of 24 hours. It stays above the same point on the surface, which is useful for communications.",
    },
    {
      heading: "Too slow, too fast",
      body: "Launched slower than $\\sqrt{GM/r}$, the satellite falls into an ellipse, and may hit the planet. Launched faster, it rises into a larger ellipse. At $\\sqrt{2}$ times the circular speed (the escape speed) it has enough energy to leave the planet's field forever.",
    },
  ],
  outcomes: [
    { code: "13.2", text: "Use Newton's law of gravitation and analyse circular orbits by relating gravitational force to centripetal acceleration." },
    { code: "13.2", text: "Understand geostationary orbits and their use." },
    { code: "13.3", text: "Use g = GM/r² for the field strength of a point mass." },
  ],
};

export const activity: ActivityDefinition = {
  title: "How does orbit radius affect the period?",
  steps: [
    {
      kind: "predict",
      id: "predict-double-r",
      question: "A satellite is moved to a circular orbit with twice the radius. What happens to its orbital period?",
      options: ["It stays the same", "It doubles", "It increases by about 2.8 times", "It halves"],
      correctIndex: 2,
      reveal:
        "It increases by $2^{3/2} \\approx 2.8$ times. The path is twice as long and the satellite also moves more slowly ($v \\propto 1/\\sqrt{r}$), so $T \\propto r^{3/2}$. Try r = 1.00 × 10⁷ m and r = 2.00 × 10⁷ m and compare.",
    },
    {
      kind: "task",
      id: "task-radius",
      instruction:
        "Keep the planet mass M and launch speed f = 1.00 the same. Record the period T for at least 5 different orbit radii r. Wait for one full orbit after each change so T can be measured.",
      check: { minRows: 5, varyColumn: "r", holdConstant: ["M", "f"] },
    },
    {
      kind: "analyse",
      id: "analyse-kepler",
      instruction: "Choose axes that give a straight line through the origin.",
      target: { x: "r3", y: "T2" },
      expectedGradient: (rows) => (4 * Math.PI ** 2) / (G * rows[0].M),
      gradientUnit: "s² m⁻³",
      tolerancePct: 3,
      hint: "Combine $\\frac{GMm}{r^2} = m\\omega^2 r$ with $\\omega = 2\\pi/T$. Which power of T is proportional to which power of r?",
    },
    {
      kind: "explain",
      id: "explain-geostationary",
      question:
        "A geostationary satellite has T = 24 h. Compared with a satellite whose period is 3 h, its orbit radius is:",
      options: ["8 times larger", "4 times larger", "2 times larger", "64 times larger"],
      correctIndex: 1,
      feedbackCorrect: "Correct. T is 8 times larger, so T² is 64 times larger, so r³ is 64 times larger and r = ∛64 = 4 times larger.",
      feedbackWrong: "Not quite. Use T² ∝ r³: if T is 8 times larger, how many times larger is T², and so r³?",
      prompt: "Use the gradient of your T²–r³ graph to calculate the mass of the planet M. Show each step.",
    },
  ],
};
