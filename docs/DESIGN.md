# Physics Simulation Lab — Design Spec (v1)

- **Date:** 2026-09-29
- **Status:** Approved
- **Working name:** "Physics Sim Lab" (the final name is the author's choice and does not affect this design)

## 1. Purpose and context

An open-source website of **interactive physics simulations** for students of **Cambridge International AS & A Level Physics (9702)**. It is built as an extra-credit project for Mr. Afta's physics class, and it is also meant to be useful to other students and teachers.

**Relation to existing work.** Mr. Afta already maintains *Physics Sandbox* (github.com/Nekodinger/v1–v8), a full learning platform with lessons, experiments, practice questions, AI Makerspace and a teacher panel. This project is an **independent platform** with a different core: high-quality, hand-built simulations with guided inquiry and virtual-lab data analysis. It does not duplicate his lesson and quiz features.

**Success criteria for v1**
1. Three simulations for the topics currently taught (circular motion, gravitational fields, oscillations) run correctly on laptop and phone browsers.
2. Each simulation page supports the full flow: Predict → Test → Analyse → Explain → Hand in.
3. The physics is verified by automated tests against the standard 9702 formulas.
4. The site is deployed on GitHub Pages from a public repository, with a documented way to add a new simulation.

## 2. Scope

**In v1**
- Pages: Home, Topic pages, Simulation pages, About.
- Three simulations (section 5).
- Per-simulation: canvas simulation, controls, live readouts, guided activity, data table, graph with best-fit line, collapsible theory panel, hand-in export.
- Progress saved in the browser (localStorage), with no accounts.
- English only, with all text in content files so it can be translated later.

**Explicitly out of v1** (future versions)
- Database, student accounts, teacher class codes or dashboards.
- Challenge mode (goal-based puzzles).
- Indonesian translation.
- Visual design polish. v1 uses a clean, functional prototype UI, and a dedicated UI design pass comes later.

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) with `output: 'export'` (fully static) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Simulation rendering | HTML `<canvas>` 2D, drawn by plain TS modules (framework-free) |
| Equations | KaTeX |
| Live graphs | uPlot |
| Unit tests | Vitest |
| Smoke test | Playwright |
| Hosting | GitHub Pages via GitHub Actions |
| License | MIT |

Static export constraints: no API routes, no server rendering at request time, no `next/image` optimization (`images.unoptimized: true`), and `basePath` set to the repository name for GitHub Pages.

## 4. Architecture

### 4.1 Routes
| Route | Content |
|---|---|
| `/` | What the site is, and a grid of topics |
| `/topics/[topic]` | Topic overview and its simulations, with 9702 syllabus codes |
| `/sims/[slug]` | Simulation page (section 6) |
| `/about` | Open-source info, how to contribute, credits |

All dynamic routes are pre-rendered with `generateStaticParams` from the simulation registry.

### 4.2 Code layout
```
app/                    Next.js routes only (thin)
components/             Shared React UI: SimLayout, Controls, Slider, Readouts,
                        ActivityPanel, DataTable, Graph, TheoryPanel, MathBlock, HandInView
lib/simkit/             Framework-free engine:
  types.ts              SimDefinition contract and shared types
  loop.ts               fixed-timestep engine loop
  canvas.ts             DPI-aware canvas setup and drawing helpers
  recorder.ts           readings → rows, derived columns
  fit.ts                least-squares linear fit
  activity.ts           activity step evaluation (grading and gating)
  format.ts             significant figures and unit formatting
  storage.ts            Storage interface + localStorage adapter
sims/
  registry.ts           list of all simulations and topics
  _template/            copy-this starter for new simulations
  <slug>/
    physics.ts          pure physics (no React, no DOM)
    render.ts           canvas drawing of a state
    content.ts          theory, activity, derived-column labels (English)
    index.ts            exports the SimDefinition
tests/                  Vitest unit tests + Playwright smoke test
```

**Dependency rule:** `sims/*/physics.ts` imports nothing from React, the DOM or `components/`. `lib/simkit/` imports nothing from React except inside the thin hooks in `components/`.

### 4.3 The simulation contract
```ts
interface ParamSpec {
  id: string; label: string; symbol: string; unit: string;
  min: number; max: number; step: number; default: number;
}

interface Quantity { value: number; unit: string; sf: number }

interface DerivedColumn {
  id: string;            // e.g. "T2"
  label: string;         // e.g. "T²"
  unit: string;          // e.g. "s²"
  compute: (row: Record<string, number>) => number;
}

interface SimEvent { kind: string; message: string } // e.g. crashed, escaped

interface SimDefinition<State, Params> {
  slug: string; title: string; topic: string; syllabusRefs: string[];
  params: ParamSpec[];
  initialState(params: Params): State;
  step(state: State, params: Params, dt: number): State;   // pure
  readouts(state: State, params: Params): Record<string, Quantity>;
  events?(state: State, params: Params): SimEvent | null;  // terminal conditions
  render(ctx: CanvasRenderingContext2D, state: State, params: Params, view: ViewInfo): void;
  derivedColumns: DerivedColumn[];
  content: { theory: TheoryContent; activity: ActivityDefinition };
}
```

### 4.4 Runtime data flow
1. **Sliders → params.** Params live in React state. A change that affects initial conditions resets the simulation.
2. **Engine loop** (`loop.ts`) is held in a ref, outside React re-rendering. It advances physics with a fixed small `dt`, running multiple sub-steps per frame, independent of frame rate. It renders once per animation frame, pauses when the tab is hidden (`visibilitychange`), and stops when `events()` returns an event.
3. **Readouts** are pushed to React at about 10 Hz and formatted with `format.ts` to the declared significant figures.
4. **Record reading** snapshots `{...params, ...readouts}` into a row in the data table. Derived columns are computed from the row using the simulation's declared `derivedColumns` only (no user-typed formulas).
5. **Graph**: the student selects the x and y columns (raw or derived). `fit.ts` computes the least-squares line, and the graph shows the points, the best-fit line, the gradient (with unit) and the y-intercept.

## 5. The v1 simulations

### 5.1 Centripetal force: "Whirling bung" (`centripetal-force`, 9702 §12)
- **Model:** mass m moving in a horizontal circle of radius r at speed v, drawn from above.
- **Params:** m, r, v.
- **Readouts:** ω = v/r, T = 2πr/v, a = v²/r, F = mv²/r.
- **Options:** toggle the velocity and acceleration vectors. A "Cut the string" action releases the mass, which then moves in a straight line along the tangent.
- **Derived columns:** v², ω², 1/r.
- **Activity target:** discover F ∝ v² (a straight line through the origin on F vs v², with gradient m/r).
- **Predict trap:** the path of the mass after the string is cut.

### 5.2 Satellite orbits (`satellite-orbits`, 9702 §13)
- **Model:** a point satellite around a planet of mass M, with Newtonian gravity F = GMm/r². Numerical integration uses velocity Verlet. The launch speed defaults to the circular orbital speed for the chosen r, with an optional launch-speed multiplier.
- **Params:** r, M (with an Earth preset), launch-speed multiplier (default 1.0).
- **Readouts:** T, v, g = GM/r², time elapsed.
- **Events:** `crashed` when the distance is below the planet's radius, and `escaped` when the total energy is ≥ 0 and the distance exceeds 10 × the launch radius. Each event shows an explanatory message.
- **Derived columns:** T², r³.
- **Activity target:** discover T² ∝ r³, with gradient 4π²/GM, and find the geostationary radius for T = 24 h.

### 5.3 Mass–spring oscillator (`mass-spring`, 9702 §17)
- **Model:** a horizontal mass–spring system with linear damping, m·a = −k·x − b·v, integrated numerically.
- **Params:** m, k, amplitude A, damping b (0 = none).
- **Readouts:** x, v, a, T (measured from successive crossings of equilibrium in the same direction), KE, PE, total E.
- **Live graphs:** x–t, v–t, a–t, and energy–t (KE, PE, total).
- **Derived columns:** T², √m.
- **Activity target:** discover T ∝ √m (a straight line on T² vs m, with gradient 4π²/k).
- **Predict trap:** the period does **not** depend on amplitude.
- **Damping:** covers light, heavy and critical damping.

## 6. Simulation page behaviour

**Layout (desktop)**
- Breadcrumb and syllabus badge at the top.
- Canvas, controls and readouts on the left, with the guided activity on the right.
- Data table and graph below.
- Theory panel collapsible at the bottom.

**Layout (phone):** a single column in the order canvas → controls → readouts → activity → data → graph → theory.

**Flow**
1. **Predict:** a multiple-choice prediction. The Play button is locked until the student answers.
2. **Test:** a task step, such as "record at least 5 readings with different r". It is checked automatically against the data table.
3. **Analyse:** the student chooses graph axes. The step passes when the chosen axes give the target linear relationship **and** the fitted gradient is within the declared tolerance of the true value.
4. **Explain:** a check question (auto-graded) and a free-text explanation (saved but not graded).
5. **Hand in:** "Download my work" opens a print-styled summary with the prediction, data table, graph, fit results, answers and explanation. The student saves it as PDF with the browser's print dialog.

**Free-play toggle:** "Skip activity" unlocks everything, for exploration or projector demos. It is recorded in the hand-in summary.

### 6.1 Activity definition (data, in `content.ts`)
```ts
type ActivityStep =
  | { kind: 'predict'; question: string; options: string[]; correctIndex: number; feedback: string }
  | { kind: 'task'; instruction: string; check: { minRows: number; distinctParam?: string } }
  | { kind: 'analyse'; instruction: string; target: { x: string; y: string };
      expectedGradient: (params: Record<string, number>) => number; tolerancePct: number }
  | { kind: 'explain'; question: string; options: string[]; correctIndex: number; prompt: string };
```
A wrong prediction is allowed (it is a prediction), and the student sees the result during Explain. Check questions give feedback and allow retry.

## 7. Storage

```ts
interface ProgressStore {
  load(slug: string): SimProgress | null;
  save(slug: string, progress: SimProgress): void;
}
```
- `SimProgress` includes `schemaVersion`, the current step, answers, data rows, the selected graph axes, the explanation text and the free-play flag.
- v1 adapter: localStorage, with keys prefixed `physlab:v1:<slug>`.
- A future database adapter (Supabase, Firebase or Google Apps Script, to be chosen later) implements the same interface. No simulation or component code changes.

## 8. Error handling
- **Physics terminal events** (crash, escape) stop the loop and show an explanatory message with a Reset button.
- **Slider bounds** prevent non-physical values such as zero or negative mass, radius below the planet radius, or zero spring constant.
- **Unavailable storage** (private mode or blocked): the site works fully in memory and shows a small "progress won't be saved" notice.
- **Saved data** with a mismatched `schemaVersion` or invalid JSON is discarded, and the student starts fresh without an error screen.
- **Numerical safety:** if the state becomes non-finite (NaN or Infinity), the loop stops and resets, with a message.

## 9. Accessibility
- All controls are keyboard operable, with visible focus.
- Readouts are real text (announced to screen readers) rather than drawn only on the canvas.
- `prefers-reduced-motion`: the simulation starts paused and needs an explicit Play.
- The canvas has a text description (`aria-label`) of what is shown.

## 10. Testing
**Vitest unit tests**
- Circular motion: F, a, ω and T match the formulas. After a cut, the path is tangent to the circle.
- Orbits: for a circular launch, the period is within 0.5% of 2π√(r³/GM). The radius stays within 0.5% over 10 orbits. Energy drift is < 0.1% over 10 orbits. Crash and escape events trigger correctly.
- Mass–spring: with b = 0, the period is within 0.5% of 2π√(m/k), total energy drift is < 0.1% over 20 periods, and the period is independent of amplitude. With b > 0, energy decreases monotonically.
- `fit.ts`: known datasets give the exact gradient and intercept.
- `activity.ts`: each step kind passes and fails correctly at tolerance boundaries.
- `storage.ts`: round trip, version mismatch and corrupt JSON.
- `format.ts`: significant-figure rounding.

**Playwright smoke test:** after `next build`, serve the export, open every simulation page, press Play, record a reading, and assert no console errors.

## 11. Deployment and open source
- A public GitHub repository under the MIT license.
- A GitHub Actions workflow on push to `main` runs install → Vitest → build (static export) → Playwright smoke → deploy to GitHub Pages. A failing step blocks the deploy.
- Local development uses `npm run dev`.
- Docs:
  - `README.md` covers what the site is, how to run it and how to deploy it.
  - `CONTRIBUTING.md` explains how to add a simulation: copy `sims/_template/`, implement the contract, add tests and register it in `sims/registry.ts`.

## 12. Future versions (not designed here)
- Database adapter and optional teacher class codes.
- Challenge mode.
- Indonesian translation (content files are already separated).
- UI design pass.
- More simulations across the remaining 9702 topics.
