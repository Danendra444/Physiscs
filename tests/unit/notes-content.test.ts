import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { scanDir, serializeIndex } from "@/lib/notes/scan.mjs";
import { SIMS, TOPICS, getSim, simsForTopic } from "@/sims/registry";

const dir = fileURLToPath(new URL("../../content/notes/", import.meta.url));
const scan = scanDir(dir);
const source = (topic: string) => fs.readFileSync(`${dir}${topic}.mdx`, "utf8");
const count = (text: string, tag: string) => (text.match(new RegExp(`<${tag}[\\s>/]`, "g")) ?? []).length;

describe("notes content", () => {
  it("has no content problems (bad answers, duplicate ids, mistyped components…)", () => {
    expect(scan.problems).toEqual([]);
  });

  it("has a notes file for exactly the topics marked hasNotes", () => {
    const files = Object.keys(scan.index).sort();
    const flagged = TOPICS.filter((t) => t.hasNotes).map((t) => t.id).sort();
    expect(files).toEqual(flagged);
    expect(files.length).toBeGreaterThan(0);
  });

  it("links every TrySim to a real simulation", () => {
    for (const [topic, slugs] of Object.entries(scan.trySims)) {
      for (const slug of slugs) expect(getSim(slug), `${topic}: TrySim "${slug}"`).toBeDefined();
    }
  });

  it("links to every simulation that belongs to its topic", () => {
    for (const topic of Object.keys(scan.index)) {
      for (const sim of simsForTopic(topic)) {
        expect(scan.trySims[topic], `${topic} should link to ${sim.slug}`).toContain(sim.slug);
      }
    }
    expect(SIMS.length).toBeGreaterThan(0);
  });

  it("gives every notes page the promised parts", () => {
    for (const topic of Object.keys(scan.index)) {
      const text = source(topic);
      expect(count(text, "Definition"), `${topic}: Definition`).toBeGreaterThanOrEqual(1);
      expect(count(text, "KeyEquation"), `${topic}: KeyEquation`).toBeGreaterThanOrEqual(3);
      expect(count(text, "WorkedExample"), `${topic}: WorkedExample`).toBeGreaterThanOrEqual(2);
      expect(count(text, "CommonMistake"), `${topic}: CommonMistake`).toBeGreaterThanOrEqual(1);
      expect(count(text, "ExamTip"), `${topic}: ExamTip`).toBeGreaterThanOrEqual(1);
      expect(count(text, "Checklist"), `${topic}: Checklist`).toBe(1);
      expect(scan.index[topic].checks.length, `${topic}: SelfCheck count`).toBeGreaterThanOrEqual(5);
      expect(scan.index[topic].checklist.length, `${topic}: checklist items`).toBeGreaterThanOrEqual(6);
      expect(scan.index[topic].headings.length, `${topic}: sections`).toBeGreaterThanOrEqual(3);
    }
  });

  it("mixes multiple-choice and numeric self-checks", () => {
    for (const [topic, entry] of Object.entries(scan.index)) {
      const kinds = new Set(entry.checks.map((c) => c.kind));
      expect(kinds, topic).toEqual(new Set(["choice", "number"]));
    }
  });

  it("keeps content/notes/index.json up to date (run: npm run notes:index)", () => {
    const saved = fs.readFileSync(`${dir}index.json`, "utf8");
    expect(saved).toBe(serializeIndex(scan.index));
  });
});
