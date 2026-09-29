import { describe, expect, it } from "vitest";
import { SIMS, TOPICS, getSim, simsForTopic } from "@/sims/registry";

describe("registry", () => {
  it("has unique simulation slugs and topic ids", () => {
    expect(new Set(SIMS.map((s) => s.slug)).size).toBe(SIMS.length);
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
  });

  it("puts every simulation in an existing topic", () => {
    for (const sim of SIMS) expect(TOPICS.map((t) => t.id)).toContain(sim.topic);
  });

  it("gives every topic at least one simulation", () => {
    for (const topic of TOPICS) expect(simsForTopic(topic.id).length).toBeGreaterThan(0);
  });

  it("has parameter defaults within their slider range", () => {
    for (const sim of SIMS) {
      for (const p of sim.params) {
        expect(p.default, `${sim.slug}.${p.id}`).toBeGreaterThanOrEqual(p.min);
        expect(p.default, `${sim.slug}.${p.id}`).toBeLessThanOrEqual(p.max);
      }
    }
  });

  it("has no id clashes between params, readouts and derived columns", () => {
    for (const sim of SIMS) {
      const defaults = Object.fromEntries(sim.params.map((p) => [p.id, p.default]));
      const readouts = sim.readouts(sim.initialState(defaults), defaults);
      const ids = [...sim.params.map((p) => p.id), ...sim.recordable, ...sim.derivedColumns.map((d) => d.id)];
      expect(new Set(ids).size, sim.slug).toBe(ids.length);
      for (const id of sim.recordable) expect(readouts, `${sim.slug}.${id}`).toHaveProperty(id);
    }
  });

  it("refers only to real columns in its activity", () => {
    for (const sim of SIMS) {
      const cols = new Set([...sim.params.map((p) => p.id), ...sim.recordable, ...sim.derivedColumns.map((d) => d.id)]);
      for (const step of sim.content.activity.steps) {
        if (step.kind === "task") {
          if (step.check.varyColumn) expect(cols, sim.slug).toContain(step.check.varyColumn);
          for (const c of step.check.holdConstant ?? []) expect(cols, sim.slug).toContain(c);
        }
        if (step.kind === "analyse") {
          expect(cols, sim.slug).toContain(step.target.x);
          expect(cols, sim.slug).toContain(step.target.y);
        }
        if (step.kind === "predict" || step.kind === "explain") {
          expect(step.correctIndex).toBeLessThan(step.options.length);
        }
      }
    }
  });

  it("finds simulations by slug", () => {
    expect(getSim("mass-spring")?.title).toBe("Mass–spring oscillator");
    expect(getSim("nope")).toBeUndefined();
  });
});
