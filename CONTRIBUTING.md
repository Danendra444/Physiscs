# How to contribute

There are two kinds of contribution: [notes for a topic](#how-to-add-notes-for-a-topic) and [a simulation](#how-to-add-a-simulation).

**Ground rule for all content:** write it yourself, in your own words. Don't copy from textbooks, revision websites or Cambridge past papers. Definitions should use the wording a 9702 mark scheme expects, but as your own sentences.

# How to add notes for a topic

A topic's notes are one file: `content/notes/<topic-id>.mdx`. The topic ids are in `sims/registry.ts`.

## 1. Mark the topic as having notes

In `sims/registry.ts`, find the topic and add `true` as the last argument, for example `defineTopic(14, "temperature", "Temperature", "…", true)`.

## 2. Write the file

MDX is Markdown plus a few building blocks. **You don't need to import anything.** Look at `content/notes/oscillations.mdx` as a model. Use `##` for each main section (they make the contents list), and `###` inside a section.

Maths goes between `$…$` for inline and `$$…$$` for a displayed equation. Avoid `<` and `{` `}` in ordinary text (write "less than"), and don't use Markdown tables: use `KeyEquation` instead.

The building blocks, with the exact shape to copy:

````mdx
<Definition term="Radian">
One radian is the angle subtended at the centre of a circle by an arc equal in length to the radius.
</Definition>

<KeyEquation
  tex="F = ma"
  where="F | resultant force | N
m | mass | kg
a | acceleration | m s⁻²" />

<WorkedExample
  title="A short title"
  marks={3}
  steps="First step, with maths like $F = ma$.
Second step.
The last step is the final answer."
>
The question, written as normal Markdown.
</WorkedExample>

<CommonMistake>What students get wrong.</CommonMistake>

<ExamTip>What examiners look for.</ExamTip>

<SelfCheck
  id="unique-id-1"
  question="A multiple-choice question."
  options="First option
Second option
Third option"
  answer={1}
  explanation="Why the second option is right. (answer counts from 0)" />

<SelfCheck
  id="unique-id-2"
  question="A calculation."
  answer={4.7}
  unit="m s⁻¹"
  tolerancePct={2}
  explanation="The working." />

<TrySim slug="mass-spring" />

<Checklist
  items="first-id | I can do this.
second-id | I can do that." />
````

Each line of `where`, `steps`, `options` and `items` is one row. `where` rows have three parts (symbol, meaning, unit) separated by ` | `, and `items` rows have an id and a sentence separated by ` | `. Put the `Checklist` once, at the end.

Inside quoted values, write TeX with single backslashes (`tex="\dfrac{mv^2}{r}"`). Numbers in braces must be plain numbers (`answer={4.7}`, not a calculation).

Each page needs at least: a definition, three key equations, two worked examples, a common mistake, an exam tip, five self-checks (both kinds) and a checklist of six or more items. If the topic has simulations, link to each one with `TrySim`.

## 3. Check every number

Every number in a worked example or numeric self-check must be correct. Work it out on a calculator, and keep the same significant figures as the note. Then add the calculation to `tests/unit/notes-numbers.test.ts`, following the existing examples: the test recomputes the value and fails if the note says something different.

## 4. Check the file

```bash
npm run notes:index   # scans your notes and lists any mistake in plain words
npm test
npm run build
npm run test:e2e
```

`npm run notes:index` also updates `content/notes/index.json`; commit that file with your notes. Open the page with `npm run dev`, answer every self-check, and look at it on a phone.

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
