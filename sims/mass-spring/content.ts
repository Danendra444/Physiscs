import type { ActivityDefinition, TheoryContent } from "@/lib/simkit/types";

// All student-facing text for this simulation. Inline maths uses $…$ (KaTeX).

export const theory: TheoryContent = {
  summary:
    "A mass on a spring oscillates with simple harmonic motion (SHM): its acceleration is always directed towards the equilibrium position and is proportional to its displacement from it.",
  equations: [
    { tex: "a = -\\omega^2 x", caption: "Defining equation of SHM" },
    { tex: "\\omega = \\sqrt{\\dfrac{k}{m}}", caption: "Angular frequency of a mass–spring system" },
    { tex: "T = \\dfrac{2\\pi}{\\omega} = 2\\pi\\sqrt{\\dfrac{m}{k}}", caption: "Period" },
    { tex: "E = \\tfrac{1}{2} m v^2 + \\tfrac{1}{2} k x^2 = \\tfrac{1}{2} k A^2", caption: "Total energy (no damping)" },
  ],
  sections: [
    {
      heading: "Why it is SHM",
      body: "The spring pulls with force $F = -kx$ (Hooke's law). Newton's second law gives $ma = -kx$, so $a = -\\frac{k}{m}x$. This has the form $a = -\\omega^2 x$ with $\\omega^2 = k/m$.",
    },
    {
      heading: "What the period depends on",
      body: "The period depends only on $m$ and $k$, not on the amplitude $A$. A larger amplitude means a longer journey, but the restoring force and speeds are larger in proportion, so each cycle takes the same time.",
    },
    {
      heading: "Energy",
      body: "Energy changes continuously between kinetic energy (maximum at $x = 0$) and elastic potential energy (maximum at $x = \\pm A$). Without damping the total stays constant.",
    },
    {
      heading: "Damping",
      body: "A resistive force $-bv$ removes energy, so the amplitude decreases. With light damping the mass still oscillates. With heavy damping it returns slowly without oscillating. Critical damping returns it to equilibrium in the shortest time without oscillating.",
    },
  ],
  outcomes: [
    { code: "17.1", text: "Describe simple harmonic motion using a = −ω²x and relate period, frequency and angular frequency." },
    { code: "17.2", text: "Describe the interchange between kinetic and potential energy in SHM." },
    { code: "17.3", text: "Describe light, heavy and critical damping." },
  ],
};

export const activity: ActivityDefinition = {
  title: "How does the mass affect the period?",
  steps: [
    {
      kind: "predict",
      id: "predict-amplitude",
      question:
        "You pull the mass twice as far before releasing it (double the amplitude A). What happens to the period T?",
      options: ["T doubles", "T increases, but by less than double", "T stays the same", "T halves"],
      correctIndex: 2,
      reveal:
        "The period stays the same. The mass travels twice as far, but the restoring force and its speed are also doubled, so each oscillation takes the same time. Try it: change A and compare the measured T.",
    },
    {
      kind: "task",
      id: "task-mass",
      instruction:
        "Keep k and the damping b the same. Record the period T for at least 5 different masses m. Wait for T to be measured after each change, then press Record reading.",
      check: { minRows: 5, varyColumn: "m", holdConstant: ["k", "b"] },
    },
    {
      kind: "analyse",
      id: "analyse-t2-m",
      instruction:
        "Choose axes that give a straight line through the origin. Theory says $T = 2\\pi\\sqrt{m/k}$.",
      target: { x: "m", y: "T2" },
      expectedGradient: (rows) => (4 * Math.PI ** 2) / rows[0].k,
      gradientUnit: "s² kg⁻¹",
      tolerancePct: 3,
      hint: "Square both sides of $T = 2\\pi\\sqrt{m/k}$. Which quantity is then directly proportional to m?",
    },
    {
      kind: "explain",
      id: "explain-relationship",
      question: "Your graph of T² against m is a straight line through the origin. What does this show?",
      options: [
        "T is directly proportional to m",
        "T² is directly proportional to m, so T is proportional to √m",
        "T is inversely proportional to m",
        "T does not depend on m",
      ],
      correctIndex: 1,
      feedbackCorrect: "Correct. Quadrupling the mass doubles the period.",
      feedbackWrong:
        "Not quite. A straight line through the origin on a T²–m graph means T² ∝ m. Look again at which quantity is on each axis.",
      prompt: "Explain how you could use the gradient of your T²–m graph to find the spring constant k.",
    },
  ],
};
