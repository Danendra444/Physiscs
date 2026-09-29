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
| `/` | "Start revising" cards for the available topics, then the full syllabus map: all 25 topics grouped AS (1–11) / A Level (12–25); topics without content are dimmed and not linked |
| `/topics/[topic]/` | Topic hub: overview, module tabs (Notes · Simulations, plus later modules), progress summary |
| `/topics/[topic]/notes/` | Notes page |
| `/sims/[slug]/` | Unchanged |

`TOPICS` in `sims/registry.ts` grows to all 25 topics. Each topic gains `hasNotes: boolean`, and a topic counts as available when it has notes or at least one simulation. Only available topics get static pages.

**Cross-links:** notes embed `<TrySim slug>` cards. Each simulation's Theory panel gets a "Read the full notes" link when its topic has notes.

## 4. Content format

- One MDX file per topic: `content/notes/<topic-id>.mdx`.
- MDX setup follows the Next.js 16 guide: `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react` and `@types/mdx`, with a root `mdx-components.tsx`, plus `remark-math`, `rehype-slug` (heading ids for the contents list) and `rehype-katex`, all passed **by string name** (required by Turbopack).
- Pages load the file with a dynamic import: `await import(\`@/content/notes/${topic}.mdx\`)`, together with `generateStaticParams` and `dynamicParams = false`.
- A notes file has no metadata export. The title, level and summary come from `TOPICS` in `sims/registry.ts`, and the "I can…" checklist is a `<Checklist items="…" />` component inside the file, so everything a note contains is in one place.
- Component props are plain strings and numbers, so no JavaScript has to be written in a note. Multi-line values put one item per line: `items="id | text"`, `options="…"`, `steps="…"` and `where="symbol | meaning | unit"`. Inside those quoted strings, write TeX with single backslashes, for example `tex="\dfrac{mv^2}{r}"`.
- Diagrams are SVG files in `public/notes/<topic-id>/`.
- Headings: `##` for each sub-topic section (these make up the table of contents) and `###` inside sections.

## 5. MDX components (`components/notes/`)

| Component | Props | Renders |
|---|---|---|
| `Definition` | `term`, children | A highlighted box labelled "Learn this wording" |
| `KeyEquation` | `tex`, `where` (one "symbol / meaning / unit" row per line, separated by ` \| `) | A displayed equation and a symbol table |
| `WorkedExample` | `title`, `marks`, `steps` (one step per line, with `$…$` maths), and the question as MDX children | The question with its marks. Steps are revealed one at a time with "Show next step" and "Show all" |
| `CommonMistake` | children | A warning callout |
| `ExamTip` | children | A tip callout |
| `SelfCheck` | `id`, `question`, `explanation`, then either `options` (one per line) + `answer` (index), or `answer` (number) + `unit` + `tolerancePct` | An instantly marked question whose result is saved |
| `TrySim` | `slug` | A card with the simulation's title and summary, linking to it |
| `Checklist` | `items` (one "id \| text" line per item) | Tickable "I can…" statements whose ticks are saved |

**Numeric SelfCheck marking**
- The input takes a number only. The unit is shown next to it and is not typed.
- Input that isn't a number shows "Enter a number" and isn't marked.
- A value within `tolerancePct` of the answer is correct.
- The explanation appears after a correct answer or after 2 wrong attempts.
- Accepted formats: `1.5`, `1,5` (decimal comma), `-2` (also the Unicode minus), `3e8` and `3×10^8`. Text with both a comma and a dot (`1,000.5`) or several commas is rejected as ambiguous.
- The correct answer is shown to 3 significant figures.

## 6. Page layout

- **Header:** topic number and title, level (AS/A2), outcome codes, and a "Print notes" button.
- **Table of contents:** built from the `##` headings. It's a sticky sidebar at `lg` width and above, and a collapsible "Contents" block on smaller screens.
- **Body:** the MDX content, then the Checklist at the end.
- **Print:** no navigation or contents list; worked examples print with all steps shown; self-checks print as questions only.

## 7. Progress storage

A generic helper in `lib/store.ts` is shared by simulation progress (`lib/simkit/storage.ts`) and notes progress (`lib/notes/progress.ts`):

```ts
createStore<T>(backend, { prefix: string; validate: (v: unknown) => v is T }): {
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
- Scans `content/notes/*.mdx` (`lib/notes/scan.mjs`, also used by the index script). For each file it checks that:
  - component names are spelled correctly, and required props are present;
  - self-check ids are unique;
  - multiple-choice answers are valid option indices, with at least 2 options;
  - numeric answers are finite and non-zero, with `unit` and `tolerancePct > 0`;
  - `TrySim` slugs exist in the registry, and a topic links to each of its simulations;
  - checklist ids are unique, and headings contain no maths;
  - every topic with `hasNotes = true` has a file, and every file matches a topic;
  - each page has the promised parts (definitions, equations, worked examples, mistakes, tips, self-checks of both kinds, checklist);
  - `content/notes/index.json` is up to date with the files.
- The scanner itself is tested with deliberately broken notes.

**Number test (Vitest)**
- Every worked-example result and every numeric self-check answer is recomputed from the question's inputs and compared with the text of the note.

**Browser tests (Playwright)**
- Each notes page loads without console errors, with maths rendered, a working contents list, and no overflow.
- Self-checks (numeric and multiple choice) are marked correctly, count attempts, and survive a reload; the checklist ticks persist and show on the topic hub.
- Worked examples reveal step by step, and print with every step.
- Notes still work when the browser blocks storage.
- The home page shows all 25 topics, with unavailable ones not linked, and a crawl from the home page finds no broken internal link.

## 10. Content production

- Notes for the 3 topics are drafted as original text following the 9702 learning outcomes.
- Every numeric value in worked examples and self-checks is checked by calculation.
- Drafts are reviewed and edited by the author, and ideally by the physics teacher, before release.
