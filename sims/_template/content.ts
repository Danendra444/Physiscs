// TEMPLATE: all student-facing text. Inline maths uses $…$ (KaTeX).
import type { ActivityDefinition, TheoryContent } from "@/lib/simkit/types";

export const theory: TheoryContent = {
  summary: "One or two sentences on the key idea.",
  equations: [{ tex: "s = ut", caption: "Displacement at constant velocity" }],
  sections: [{ heading: "Explanation", body: "Explain the physics here." }],
  outcomes: [{ code: "2.1", text: "Paraphrase the 9702 learning outcome this covers." }],
};

export const activity: ActivityDefinition = {
  title: "Question the activity answers",
  steps: [
    {
      kind: "predict",
      id: "predict-1",
      question: "A question students answer before running the simulation.",
      options: ["Option A", "Option B"],
      correctIndex: 0,
      reveal: "What they should notice when they test it.",
    },
    {
      kind: "task",
      id: "task-1",
      instruction: "What to measure.",
      check: { minRows: 5, varyColumn: "u" },
    },
    {
      kind: "analyse",
      id: "analyse-1",
      instruction: "Choose axes that give a straight line.",
      target: { x: "u", y: "x" },
      expectedGradient: () => 1,
      gradientUnit: "s",
      tolerancePct: 3,
      hint: "A hint shown when the axes are wrong.",
    },
    {
      kind: "explain",
      id: "explain-1",
      question: "A check question about what the graph shows.",
      options: ["Option A", "Option B"],
      correctIndex: 0,
      feedbackCorrect: "Why it's right.",
      feedbackWrong: "A nudge towards the right idea.",
      prompt: "An open question for a written explanation.",
    },
  ],
};
