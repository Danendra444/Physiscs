import type { ActivityDefinition, TheoryContent } from "@/lib/simkit/types";

export const theory: TheoryContent = {
  summary:
    "An object moving at constant speed in a circle is always accelerating, because its direction keeps changing. The acceleration points towards the centre, so a resultant force towards the centre (the centripetal force) is needed.",
  equations: [
    { tex: "v = r\\omega", caption: "Speed and angular speed" },
    { tex: "T = \\dfrac{2\\pi}{\\omega} = \\dfrac{2\\pi r}{v}", caption: "Period" },
    { tex: "a = r\\omega^2 = \\dfrac{v^2}{r}", caption: "Centripetal acceleration" },
    { tex: "F = mr\\omega^2 = \\dfrac{mv^2}{r}", caption: "Centripetal force" },
  ],
  sections: [
    {
      heading: "Where the force comes from",
      body: "For a whirling bung the centripetal force is the tension in the string. It is not an extra force: it is the name for whichever real force (tension, gravity, friction…) points towards the centre.",
    },
    {
      heading: "Why no work is done",
      body: "The force is always perpendicular to the velocity, so it changes the direction of motion but not the speed. The kinetic energy stays constant.",
    },
    {
      heading: "If the string breaks",
      body: "With no resultant force, Newton's first law applies: the bung continues in a straight line in the direction it was moving at that instant, along the tangent to the circle. It does not fly outwards along the radius.",
    },
  ],
  outcomes: [
    { code: "12.1", text: "Define the radian and angular displacement, and use v = rω." },
    { code: "12.2", text: "Understand that a resultant force of constant size perpendicular to the velocity causes uniform circular motion." },
    { code: "12.2", text: "Use a = rω² = v²/r and F = mrω² = mv²/r." },
  ],
};

export const activity: ActivityDefinition = {
  title: "What sets the force needed for circular motion?",
  steps: [
    {
      kind: "predict",
      id: "predict-cut",
      question:
        "The bung is whirling anticlockwise. The string is suddenly cut. Which path does the bung follow straight afterwards (seen from above)?",
      options: [
        "Straight outwards, away from the centre",
        "A straight line along the tangent, in the direction it was moving",
        "It keeps curving along the circle for a while",
        "It spirals outwards",
      ],
      correctIndex: 1,
      reveal:
        "It moves in a straight line along the tangent. Once the string is cut there is no resultant force, so by Newton's first law the bung keeps the velocity it had at that instant. Press Play, then Cut string to see it.",
    },
    {
      kind: "task",
      id: "task-speed",
      instruction: "Reset the simulation. Keep m and r constant and record the force F for at least 5 different speeds v.",
      check: { minRows: 5, varyColumn: "v", holdConstant: ["m", "r"] },
    },
    {
      kind: "analyse",
      id: "analyse-f-v2",
      instruction: "Choose axes that give a straight line through the origin.",
      target: { x: "v2", y: "F" },
      expectedGradient: (rows) => rows[0].m / rows[0].r,
      gradientUnit: "kg m⁻¹",
      tolerancePct: 2,
      hint: "The force depends on v, but not in direct proportion. Look at the equation $F = \\frac{mv^2}{r}$: which quantity is F directly proportional to?",
    },
    {
      kind: "explain",
      id: "explain-double-v",
      question: "At the same radius, the speed of the bung is doubled. The centripetal force needed:",
      options: ["doubles", "becomes four times larger", "halves", "stays the same"],
      correctIndex: 1,
      feedbackCorrect: "Correct. F ∝ v², so doubling v multiplies F by 2² = 4.",
      feedbackWrong: "Not quite. Your graph shows F ∝ v². What happens to v² when v doubles?",
      prompt: "Explain what the gradient of your F–v² graph is equal to, and how you could use it to find the mass of the bung.",
    },
  ],
};
