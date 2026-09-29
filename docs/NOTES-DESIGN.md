# Notes Module — Design (v1)

- **Date:** 2026-09-29
- **Status:** Approved
- **Builds on:** [DESIGN.md](DESIGN.md) (the simulation site)

## 1. Purpose and context

The site grows from a set of simulations into a revision platform for Cambridge International AS & A Level Physics (9702) with four modules:

| Module | Status |
|---|---|
| Simulations and experiments | Exists (3 simulations with guided activities) |
| **Notes** | **This design** |
| Question bank (exam-style questions with mark schemes and worked solutions) | Future design |
| Mock test (timed practice paper) | Future design; depends on the question bank |

Notes come first because every other module links back to them, and they are the fastest content to produce per topic.

**Content rule:** all notes are original writing. Nothing is copied from commercial revision sites or Cambridge past papers. Definitions use the precise wording that 9702 mark schemes expect, written in our own sentences.

**Success criteria for v1**
1. Notes for three topics: Motion in a circle (12), Gravitational fields (13) and Oscillations (17), each linked to its simulations.
2. Each notes page has definitions, key equations, worked examples, common mistakes and exam tips, self-checks, and an "I can…" checklist.
3. Self-check results and checklist ticks are saved in the browser and summarised on the topic hub.
4. Automated checks catch broken content (invalid self-checks, links to missing simulations) before deploy.

## 2. Scope

**In v1:** the full 25-topic syllabus map on the home page (3 active, 22 "coming soon"), topic hub pages, notes pages for the 3 topics, MDX components, notes progress, a print-friendly notes layout, and tests.

**Out of v1:** question bank, mock test, search, accounts, notes for the other 22 topics, and the Indonesian translation.

## 3. Site structure

| Route | Content |
|---|---|
| `/` | Syllabus map: all 25 topics grouped AS (1–11) / A Level (12–25); available modules shown per topic; the rest marked "coming soon" and not linked |
| `/topics/[topic]/` | Topic hub: overview, module tabs (Notes · Simulations, plus later modules), progress summary |
| `/topics/[topic]/notes/` | Notes page |
| `/sims/[slug]/` | Unchanged |

`TOPICS` in `sims/registry.ts` grows to all 25 topics. Each topic gains `modules: { notes: boolean }`, and a topic counts as available when it has notes or at least one simulation. Only available topics get static pages.

**Cross-links:** notes embed `<TrySim slug>` cards. Each simulation's Theory panel gets a "Read the full notes" link when its topic has notes.

## 4. Content format

- One MDX file per topic: `content/notes/<topic-id>.mdx`.
- MDX setup follows the Next.js 16 guide: `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react` and `@types/mdx`, with a root `mdx-components.tsx`, plus `remark-math` and `rehype-katex` passed **by string name** (required by Turbopack).
- Pages load the file with a dynamic import: `await import(\`@/content/notes/${topic}.mdx\`)`, together with `generateStaticParams` and `dynamicParams = false`.
- Each file exports its own metadata:
  ```mdx
  export const metadata = {
    title: "Oscillations",
    outcomes: ["17.1", "17.2", "17.3"],
    checklist: [
      { id: "shm-define", text: "I can define simple harmonic motion." },
    ],
  }
  ```
- Diagrams are SVG files in `public/notes/<topic-id>/`.
- Headings: `##` for each sub-topic section (these make up the table of contents) and `###` inside sections.

## 5. MDX components (`components/notes/`)

| Component | Props | Renders |
|---|---|---|
| `Definition` | `term`, children | A highlighted box labelled "Learn this wording" |
| `KeyEquation` | `tex`, `where: [symbol, meaning, unit][]` | A displayed equation and a symbol table |
| `WorkedExample` | `title`, `marks`, `question` (MDX children), `steps: string[]` (with `$…$` maths) | The question with its marks. Steps are revealed one at a time with "Show next step" and "Show all" |
| `CommonMistake` | children | A warning callout |
| `ExamTip` | children | A tip callout |
| `SelfCheck` | `id`, `question`, then either `options` + `answer` (index), or `answer` (number) + `unit` + `tolerancePct`; plus `explanation` | An instantly marked question whose result is saved |
| `TrySim` | `slug` | A card with the simulation's title and summary, linking to it |
| `Checklist` | none (reads the page's `metadata.checklist`) | Tickable "I can…" statements whose ticks are saved |

**Numeric SelfCheck marking**
- The input takes a number only. The unit is shown next to it and is not typed.
- Input that isn't a number shows "Enter a number" and isn't marked.
- A value within `tolerancePct` of the answer is correct.
- The explanation appears after a correct answer or after 2 wrong attempts.
- Accepted formats: `1.5`, `1,5`, `-2`, `3e8` and `3×10^8`.

## 6. Page layout

- **Header:** topic number and title, level (AS/A2), outcome codes, and a "Print notes" button.
- **Table of contents:** built from the `##` headings. It's a sticky sidebar at `lg` width and above, and a collapsible "Contents" block on smaller screens.
- **Body:** the MDX content, then the Checklist at the end.
- **Print:** no navigation or contents list; worked examples print with all steps shown; self-checks print as questions only.

## 7. Progress storage

`lib/simkit/storage.ts` is refactored into a generic helper:

```ts
createStore<T>(backend, { namespace: string; version: number; validate: (v: unknown) => v is T }): {
  available: boolean;
  load(key: string): T | null;
  save(key: string, value: T): void;
  clear(key: string): void;
}
```

- Simulation progress keeps its existing keys (`physlab:v1:<slug>`), so saved student progress survives the refactor.
- Notes progress is stored under `physlab:v1:notes:<topic-id>`:
  ```ts
  interface NotesProgress {
    schemaVersion: 1;
    checks: Record<string, { correct: boolean; attempts: number }>;
    checklist: Record<string, boolean>;
  }
  ```
- The topic hub shows "Notes: X/Y self-checks · A/B checklist". The totals come from `content/notes/index.json`, a list of self-check and checklist ids per topic. It is generated by `scripts/build-notes-index.mjs`, which runs automatically before `dev` and `build`.

## 8. Error handling

- **Unavailable storage:** the same "progress won't be saved" notice as the simulation pages.
- **Corrupt or old saved notes progress:** discarded without an error screen (same rules as the simulations).
- **Content mistakes** (duplicate self-check id, `answer` out of range, unknown `TrySim` slug): these fail the content test, so they never reach the live site. At runtime, `TrySim` with an unknown slug renders nothing, rather than crashing the page.

## 9. Testing

**Unit tests (Vitest)**
- Numeric answer parsing and tolerance, including the accepted formats in section 5 and rejected input.
- The generic store: round trip, version mismatch, corrupt JSON and throwing backends. The existing simulation storage tests must still pass unchanged.

**Content test (Vitest)**
- Scans `content/notes/*.mdx`. For each file it checks that:
  - self-check ids are unique;
  - multiple-choice answers are valid option indices;
  - numeric answers are finite, with `tolerancePct > 0`;
  - `TrySim` slugs exist in the registry;
  - checklist ids are unique;
  - every topic with `modules.notes = true` has a file, and every file matches a topic;
  - `content/notes/index.json` is up to date with the files.

**Browser tests (Playwright)**
- Each notes page loads without console errors.
- A self-check can be answered and the result survives a reload.
- A checklist item can be ticked.
- No horizontal overflow on mobile.
- The home page shows all 25 topics, with unavailable ones not linked.

## 10. Content production

- Notes for the 3 topics are drafted as original text following the 9702 learning outcomes.
- Every numeric value in worked examples and self-checks is checked by calculation.
- Drafts are reviewed and edited by the author, and ideally by the physics teacher, before release.
