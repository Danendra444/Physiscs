import { describe, expect, it } from "vitest";
import { Engine } from "@/lib/simkit/loop";
import type { SimDefinition } from "@/lib/simkit/types";

// A toy simulation: x grows at speed v; it "hits the wall" at x >= 10.
type S = { t: number; x: number };
const toy: SimDefinition<S> = {
  slug: "toy",
  title: "Toy",
  topic: "t",
  summary: "",
  syllabusRefs: [],
  params: [{ id: "v", label: "Speed", symbol: "v", unit: "m/s", min: 0, max: 10, step: 1, default: 1, sf: 2 }],
  dt: 0.01,
  timeScale: () => 1,
  initialState: () => ({ t: 0, x: 0 }),
  step: (s, p, dt) => ({ t: s.t + dt, x: s.x + p.v * dt }),
  readouts: (s) => ({ x: { label: "x", symbol: "x", value: s.x, unit: "m", sf: 3 } }),
  recordable: ["x"],
  derivedColumns: [],
  events: (s) => (s.x >= 10 ? { kind: "wall", message: "Hit the wall" } : null),
  applyAction: (id, s) => (id === "jump" ? { ...s, x: s.x + 5 } : s),
  render: () => {},
  canvasLabel: "",
  content: { theory: { summary: "", equations: [], sections: [], outcomes: [] }, activity: { title: "", steps: [] } },
};

describe("Engine", () => {
  it("does not advance while paused", () => {
    const e = new Engine(toy, { v: 1 });
    e.advance(1);
    expect(e.state.x).toBe(0);
  });

  it("advances in fixed steps independent of frame length", () => {
    const a = new Engine(toy, { v: 2 });
    const b = new Engine(toy, { v: 2 });
    a.play();
    b.play();
    for (let i = 0; i < 60; i++) a.advance(1 / 60);
    for (let i = 0; i < 30; i++) b.advance(1 / 30);
    expect(a.state.x).toBeCloseTo(2, 1);
    expect(a.state.x).toBeCloseTo(b.state.x, 6);
  });

  it("caps very long frames so a background tab does not jump ahead", () => {
    const e = new Engine(toy, { v: 1 });
    e.play();
    e.advance(5);
    expect(e.state.x).toBeLessThanOrEqual(0.11);
  });

  it("stops and reports when an event occurs", () => {
    const e = new Engine(toy, { v: 10 });
    const events: string[] = [];
    e.onEvent = (ev) => events.push(ev.kind);
    e.play();
    for (let i = 0; i < 100 && e.running; i++) e.advance(0.05);
    expect(e.running).toBe(false);
    expect(events).toEqual(["wall"]);
    expect(e.event?.message).toBe("Hit the wall");
    e.play();
    expect(e.running).toBe(false);
  });

  it("reset clears the state and the event", () => {
    const e = new Engine(toy, { v: 10 });
    e.play();
    for (let i = 0; i < 100 && e.running; i++) e.advance(0.05);
    e.reset();
    expect(e.state.x).toBe(0);
    expect(e.event).toBeNull();
  });

  it("applies actions", () => {
    const e = new Engine(toy, { v: 1 });
    e.action("jump");
    expect(e.state.x).toBe(5);
  });

  it("stops with a numerical event if the state becomes non-finite", () => {
    const broken: SimDefinition<S> = { ...toy, events: undefined, step: (s) => ({ ...s, x: NaN }) };
    const e = new Engine(broken, { v: 1 });
    e.play();
    e.advance(0.05);
    expect(e.running).toBe(false);
    expect(e.event?.kind).toBe("numerical");
    expect(e.state.x).toBe(0);
  });

  it("setParams resets by default", () => {
    const e = new Engine(toy, { v: 1 });
    e.play();
    e.advance(0.05);
    e.setParams({ v: 3 });
    expect(e.state.x).toBe(0);
    expect(e.params.v).toBe(3);
  });
});
