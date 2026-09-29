# Physics Sim Lab

Free, open-source interactive physics simulations for **Cambridge International AS & A Level Physics (9702)**.

Each simulation comes with a short guided activity:

1. **Predict**: commit to an answer before running anything (Play stays locked until you do).
2. **Test**: run the simulation and record readings in a data table.
3. **Analyse**: choose graph axes that give a straight line; the site draws the best-fit line and checks your gradient against theory.
4. **Explain**: answer a check question and write a conclusion.
5. **Hand in**: download a PDF summary of your prediction, data, graph and explanation.

There are no accounts. Progress is saved in the student's own browser.

## Simulations

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
npm test            # physics accuracy and logic tests (Vitest)
npm run build       # builds the static site into out/
npm run test:e2e    # opens every simulation in a real browser (Playwright)
```

The physics tests compare each simulation with the textbook formulas. For example, the orbit period must match 2π√(r³/GM) within 0.5%, and energy must stay constant within 0.1% when there's no damping.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Every push to `main` runs the tests and, if they pass, publishes the site to `https://<username>.github.io/<repository>/`.

The workflow is in `.github/workflows/deploy.yml`.

## How the code is organised

```
app/            pages (home, topic, simulation, about)
components/     shared React UI: canvas, controls, activity, data table, graph, theory, hand-in
lib/simkit/     the engine, with no React: time-step loop, recording, best-fit line, activity checks, storage
sims/<slug>/    one folder per simulation
  physics.ts    the physics, as pure functions (unit-tested)
  render.ts     draws one frame on a canvas
  content.ts    theory text and the guided activity (all student-facing text)
  index.ts      puts it together as a SimDefinition
sims/registry.ts  the list of topics and simulations
tests/unit/     Vitest tests
tests/e2e/      Playwright smoke tests
```

Want to add a simulation? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

- More simulations across the 9702 syllabus
- Challenge mode (goal-based puzzles, e.g. "put a satellite in geostationary orbit")
- Optional teacher class codes backed by a database (only `lib/simkit/storage.ts` needs a new adapter)
- Indonesian translation (all text already lives in `content.ts` files)
- A visual design pass

## License

[MIT](LICENSE). Made as a class project, with thanks to Mr. Afta.
