import { describe, expect, it } from "vitest";
import { scanSource } from "@/lib/notes/scan.mjs";

const ok = `## First section

Some text.

<SelfCheck id="a" question="Q?" options="one
two" answer={1} explanation="Because." />

<SelfCheck id="b" question="Number?" answer={4.7} unit="m" tolerancePct={2} explanation="Because." />

<TrySim slug="mass-spring" />

## Second section

<Checklist items="c1 | I can do this.
c2 | I can do that." />
`;

const problems = (src: string) => scanSource(src, "t.mdx").problems;

describe("scanSource", () => {
  it("collects headings, self-checks, checklist items and simulation links", () => {
    const r = scanSource(ok, "t.mdx");
    expect(r.problems).toEqual([]);
    expect(r.headings).toEqual([
      { id: "first-section", text: "First section" },
      { id: "second-section", text: "Second section" },
    ]);
    expect(r.checks).toEqual([
      { id: "a", kind: "choice" },
      { id: "b", kind: "number" },
    ]);
    expect(r.checklist).toEqual([
      { id: "c1", text: "I can do this." },
      { id: "c2", text: "I can do that." },
    ]);
    expect(r.trySims).toEqual(["mass-spring"]);
  });

  it("gives repeated headings the same ids the page will (github-slugger)", () => {
    const r = scanSource("## Same\n\n## Same\n", "t.mdx");
    expect(r.headings.map((h) => h.id)).toEqual(["same", "same-1"]);
  });

  it("flags duplicate self-check ids", () => {
    const src = `<SelfCheck id="a" question="Q" answer={1} unit="m" tolerancePct={2} explanation="E" />\n\n<SelfCheck id="a" question="Q" answer={1} unit="m" tolerancePct={2} explanation="E" />`;
    expect(problems(src).join("\n")).toMatch(/duplicate.*"a"/i);
  });

  it("flags a multiple-choice answer outside the options", () => {
    const src = `<SelfCheck id="a" question="Q" options="x\ny" answer={2} explanation="E" />`;
    expect(problems(src).join("\n")).toMatch(/answer 2.*2 options/);
  });

  it("flags a non-integer or negative multiple-choice answer", () => {
    expect(problems(`<SelfCheck id="a" question="Q" options="x\ny" answer={0.5} explanation="E" />`).length).toBeGreaterThan(0);
    expect(problems(`<SelfCheck id="a" question="Q" options="x\ny" answer={-1} explanation="E" />`).length).toBeGreaterThan(0);
  });

  it("flags multiple choice with fewer than two options", () => {
    expect(problems(`<SelfCheck id="a" question="Q" options="only one" answer={0} explanation="E" />`).join("\n")).toMatch(/at least 2 options/);
  });

  it("flags numeric questions that are missing a tolerance or unit", () => {
    expect(problems(`<SelfCheck id="a" question="Q" answer={3} unit="m" explanation="E" />`).join("\n")).toMatch(/tolerancePct/);
    expect(problems(`<SelfCheck id="a" question="Q" answer={3} tolerancePct={2} explanation="E" />`).join("\n")).toMatch(/unit/);
  });

  it("flags a zero, negative or non-number tolerance", () => {
    expect(problems(`<SelfCheck id="a" question="Q" answer={3} unit="m" tolerancePct={0} explanation="E" />`).join("\n")).toMatch(/tolerancePct/);
    expect(problems(`<SelfCheck id="a" question="Q" answer={3} unit="m" tolerancePct="two" explanation="E" />`).join("\n")).toMatch(/tolerancePct/);
  });

  it("flags a numeric answer of zero (a percentage tolerance can't be applied)", () => {
    expect(problems(`<SelfCheck id="a" question="Q" answer={0} unit="m" tolerancePct={2} explanation="E" />`).join("\n")).toMatch(/zero/);
  });

  it("flags an answer that isn't a plain number", () => {
    expect(problems(`<SelfCheck id="a" question="Q" answer="4" unit="m" tolerancePct={2} explanation="E" />`).join("\n")).toMatch(/answer/);
    expect(problems(`<SelfCheck id="a" question="Q" answer={2 + 2} unit="m" tolerancePct={2} explanation="E" />`).join("\n")).toMatch(/answer/);
  });

  it("flags missing question, explanation or id", () => {
    const text = problems(`<SelfCheck answer={1} unit="m" tolerancePct={2} />`).join("\n");
    expect(text).toMatch(/id/);
    expect(text).toMatch(/question/);
    expect(text).toMatch(/explanation/);
  });

  it("flags checklist items without ids, and duplicate ids", () => {
    expect(problems(`<Checklist items="no separator here" />`).join("\n")).toMatch(/id \| text/);
    expect(problems(`<Checklist items="x | one\nx | two" />`).join("\n")).toMatch(/duplicate.*"x"/i);
  });

  it("flags a TrySim without a slug", () => {
    expect(problems(`<TrySim />`).join("\n")).toMatch(/slug/);
  });

  it("flags maths inside headings, which the contents list can't show", () => {
    expect(problems("## Speed $v$\n").join("\n")).toMatch(/heading/i);
  });

  it("reports MDX that doesn't parse", () => {
    expect(problems("Some text with an <b>unclosed tag").join("\n")).toMatch(/does not parse/);
    expect(problems("A stray {brace that never closes").join("\n")).toMatch(/does not parse/);
  });
});

describe("scanSource: other components", () => {
  it("flags a mistyped component name", () => {
    expect(problems(`<Definiton term="x">y</Definiton>`).join("\n")).toMatch(/unknown component <Definiton>/);
  });

  it("flags a WorkedExample with no marks or too few steps", () => {
    expect(problems(`<WorkedExample title="T" steps="only one" />`).join("\n")).toMatch(/marks/);
    expect(problems(`<WorkedExample title="T" marks={3} steps="only one" />`).join("\n")).toMatch(/at least 2/);
    expect(problems(`<WorkedExample title="T" marks={3} steps="one\ntwo" />`)).toEqual([]);
  });

  it("flags a KeyEquation row that isn't symbol | meaning | unit", () => {
    expect(problems(`<KeyEquation tex="a=b" where="a | only two parts" />`).join("\n")).toMatch(/symbol \| meaning \| unit/);
    expect(problems(`<KeyEquation tex="a=b" where="a | first | m" />`)).toEqual([]);
  });

  it("flags a Definition with no term", () => {
    expect(problems(`<Definition>x</Definition>`).join("\n")).toMatch(/term/);
  });

  it("accepts a numeric question with no unit when unit is given as empty", () => {
    expect(problems(`<SelfCheck id="a" question="Q" answer={4} unit="" tolerancePct={2} explanation="E" />`)).toEqual([]);
  });
});
