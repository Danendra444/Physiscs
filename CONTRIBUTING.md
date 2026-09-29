# How to add a simulation

Every simulation implements the same contract (`SimDefinition` in `lib/simkit/types.ts`). The pages, controls, data table, graph, activity and hand-in all work automatically from it. You don't need to touch any React code.

## 1. Copy the template

```bash
cp -r sims/_template sims/my-sim
```

## 2. Write the physics (`physics.ts`)

- Pure functions only: no React, no DOM, SI units.
- `initialState(params)` returns the starting state; `step(state, params, dt)` returns the next state after a small time step `dt`.
- Keep state as plain numbers (and booleans or nulls). The engine stops the simulation if any number becomes NaN or Infinity.
- Prefer an energy-conserving method such as velocity Verlet (see `sims/mass-spring/physics.ts` or `sims/satellite-orbits/physics.ts`).
- If students need to *measure* something (like a period), measure it from the motion inside `step`, as the mass–spring and orbit simulations do. Don't just compute the formula.

## 3. Test the physics first

Create `tests/unit/my-sim.test.ts` and compare your simulation with the textbook formula. Good tests:

- a measured quantity matches the formula within a small tolerance (e.g. 0.5%)
- energy is conserved when it should be
- edge cases trigger the right events

Run `npm test`.

## 4. Draw it (`render.ts`)

`render(ctx, state, params, view)` draws one frame. Use `view.colors` (never hard-coded colours) so it works in light and dark mode, and the helpers in `lib/simkit/canvas.ts` (`clear`, `drawArrow`, `label`). Use a fixed scale where possible, so students can see things get bigger or smaller when they move a slider.

## 5. Write the content (`content.ts`)

- `theory`: a summary, key equations (KaTeX), short explanations and the 9702 learning outcomes, paraphrased.
- `activity`: four steps, in this order:
  - `predict`: a question whose answer students can check in the simulation. Pick a common misconception.
  - `task`: what to record. `check.varyColumn` is the independent variable; `check.holdConstant` lists the control variables.
  - `analyse`: the axes that give a straight line (`target`), and the theoretical gradient worked out from the recorded rows.
  - `explain`: a check question and an open prompt for a written explanation.
- Inline maths goes between `$…$`.

## 6. Define it (`index.ts`)

- `params` become sliders. Give each one sensible `min`/`max`/`step` values and the significant figures (`sf`) to record.
- `readouts` are the live values shown under the canvas; `recordable` lists which ones go into the data table.
- `derivedColumns` are calculated columns students can plot (e.g. T², r³).
- Optional: `toggles` (show or hide arrows), `actions` (buttons like "Cut string"), `events` (crash, escape…), `recordBlocker`, and `liveSeries` (live time graphs).

## 7. Register it

Add it to `SIMS` in `sims/registry.ts`. If it belongs to a new topic, add the topic to `TOPICS` too. `tests/unit/registry.test.ts` checks that ids are unique and that the activity only refers to real columns.

## 8. Check it

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

Then open it with `npm run dev` and do the whole activity yourself, on a laptop and on a phone.
