# Physics Sim Lab

Free, open-source revision site for **Cambridge International AS & A Level Physics (9702)**: notes, interactive simulations and virtual experiments. A question bank and mock tests are planned next (see the roadmap).

## Notes

Each topic with notes has one page with:

- definitions in the wording mark schemes expect, and key equations with a table of symbols and units
- worked examples that reveal one step at a time
- common mistakes and exam tips
- quick self-checks (multiple choice and numeric), marked instantly
- an "I can…" checklist, and links to the matching simulations
- a **Print notes** button for a clean revision sheet

Self-check results and checklist ticks are saved in the student's own browser, and the topic page shows the totals. All notes are original writing.

## Simulations

Each simulation comes with a short guided activity:

1. **Predict**: commit to an answer before running anything (Play stays locked until you do).
2. **Test**: run the simulation and record readings in a data table.
3. **Analyse**: choose graph axes that give a straight line; the site draws the best-fit line and checks your gradient against theory.
4. **Explain**: answer a check question and write a conclusion.
5. **Hand in**: download a PDF summary of your prediction, data, graph and explanation.

There are no accounts. Progress is saved in the student's own browser.

| Topic (9702) | Simulation | What students discover |
|---|---|---|
| 12 Motion in a circle | Centripetal force: whirling bung | F ∝ v² (gradient m/r); the path after the string is cut |
| 13 Gravitational fields | Satellite orbits | T² ∝ r³ (Kepler's third law); the geostationary orbit; crashes and escape |
| 17 Oscillations | Mass–spring oscillator | T² ∝ m (gradient 4π²/k); T doesn't depend on amplitude; energy and damping |

## Run it on your computer

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Tests

```bash
npm test            # physics, notes-content and logic tests (Vitest)
npm run build       # builds the static site into out/
npm run test:e2e    # opens every page in a real browser (Playwright)
npm run notes:index # refreshes content/notes/index.json after editing a note
```

- The physics tests compare each simulation with the textbook formulas. For example, the orbit period must match 2π√(r³/GM) within 0.5%, and energy must stay constant within 0.1% when there's no damping.
- The notes tests catch content mistakes before they go live: a wrong answer index, a duplicate id, a mistyped component name, or a link to a simulation that doesn't exist. Every number in a worked example or numeric self-check is also recomputed from the question and compared with the note.
- The browser tests answer self-checks, reload to confirm progress is saved, check printing, and crawl every link on the site.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Every push to `main` runs the tests and, if they pass, publishes the site to `https://<username>.github.io/<repository>/`.

The workflow is in `.github/workflows/deploy.yml`.

## How the code is organised

```
app/            pages (home, topic hub, notes, simulation, about)
components/     shared React UI: canvas, controls, activity, data table, graph, theory, hand-in
components/notes/  the building blocks of a note: definitions, equations, worked examples, self-checks…
content/notes/  one .mdx file per topic, plus a generated index.json
lib/simkit/     the simulation engine, with no React: time-step loop, recording, best-fit line, activity checks
lib/notes/      answer marking, notes progress, and the content scanner
lib/store.ts    saving progress in the browser (shared by simulations and notes)
sims/<slug>/    one folder per simulation
  physics.ts    the physics, as pure functions (unit-tested)
  render.ts     draws one frame on a canvas
  content.ts    theory text and the guided activity (all student-facing text)
  index.ts      puts it together as a SimDefinition
sims/registry.ts  the full 9702 topic list and the list of simulations
tests/unit/     Vitest tests
tests/e2e/      Playwright browser tests
docs/           DESIGN.md (simulations) and NOTES-DESIGN.md (notes)
```

Want to add a simulation or a topic's notes? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

- Question bank: exam-style questions by topic with mark schemes and worked solutions
- Mock tests: timed practice papers built from the question bank
- Notes for the other 22 topics, and more simulations across the 9702 syllabus
- Challenge mode (goal-based puzzles, e.g. "put a satellite in geostationary orbit")
- Optional teacher class codes backed by a database (only the store in `lib/store.ts` needs a new adapter)
- Indonesian translation (all student-facing text lives in `content.ts` and `.mdx` files)
- A visual design pass

## License

[MIT](LICENSE). Made as a class project, with thanks to Mr. Afta.
