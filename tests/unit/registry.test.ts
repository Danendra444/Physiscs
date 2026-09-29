import { describe, expect, it } from "vitest";
import { SIMS, TOPICS, availableTopics, getSim, isAvailable, simsForTopic } from "@/sims/registry";

describe("registry", () => {
  it("has unique simulation slugs and topic ids", () => {
    expect(new Set(SIMS.map((s) => s.slug)).size).toBe(SIMS.length);
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
  });

  it("puts every simulation in an existing topic", () => {
    for (const sim of SIMS) expect(TOPICS.map((t) => t.id)).toContain(sim.topic);
  });

  it("lists the whole 9702 syllabus: topics 1 to 25 in order, AS then A Level", () => {
    expect(TOPICS.map((t) => t.number)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    for (const topic of TOPICS) expect(topic.level).toBe(topic.number <= 11 ? "AS" : "A2");
    expect(TOPICS.find((t) => t.number === 12)?.title).toBe("Motion in a circle");
    expect(TOPICS.find((t) => t.number === 17)?.title).toBe("Oscillations");
  });

  it("uses url-safe topic ids (lowercase words joined by hyphens)", () => {
    for (const topic of TOPICS) expect(topic.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("treats a topic as available once it has notes or a simulation", () => {
    const ids = availableTopics().map((t) => t.id);
    expect(ids).toEqual(["circular-motion", "gravitational-fields", "oscillations"]);
    for (const topic of TOPICS) {
      expect(isAvailable(topic)).toBe(topic.hasNotes || simsForTopic(topic.id).length > 0);
    }
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
