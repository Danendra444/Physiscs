// Reads the notes (content/notes/*.mdx) without rendering them, to:
//  1. build content/notes/index.json (headings, self-checks and checklist items per topic), and
//  2. catch content mistakes (bad answers, duplicate ids, typos in component names)
//     before they can reach the live site.
// Plain .mjs so `node scripts/build-notes-index.mjs` runs without a build step.

import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

const processor = unified().use(remarkParse).use(remarkMdx).use(remarkMath);

const COMPONENTS = new Set([
  "Definition",
  "KeyEquation",
  "WorkedExample",
  "CommonMistake",
  "ExamTip",
  "SelfCheck",
  "TrySim",
  "Checklist",
]);

const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function plainText(node) {
  if (typeof node.value === "string" && node.type !== "mdxTextExpression") return node.value;
  return (node.children ?? []).map(plainText).join("");
}

/** An attribute as { present, string?, expression? }. `x="a"` is a string; `x={1}` is an expression. */
function attr(node, name) {
  const found = (node.attributes ?? []).find((a) => a.type === "mdxJsxAttribute" && a.name === name);
  if (!found) return { present: false };
  if (typeof found.value === "string") return { present: true, string: found.value };
  if (found.value && typeof found.value === "object") return { present: true, expression: found.value.value.trim() };
  return { present: true };
}

const nonEmptyString = (a) => a.present && typeof a.string === "string" && a.string.trim() !== "";
const lines = (s) => s.split("\n").map((l) => l.trim()).filter(Boolean);

/** A number written as a plain literal in braces, e.g. answer={4.7}. Returns NaN for anything else. */
function literalNumber(a) {
  return a.present && typeof a.expression === "string" && NUMBER.test(a.expression) ? Number(a.expression) : NaN;
}

function checkSelfCheck(node, seen, out) {
  const id = attr(node, "id");
  const fail = (msg) => out.problems.push(`SelfCheck ${nonEmptyString(id) ? `"${id.string}"` : "(no id)"}: ${msg}`);

  if (!nonEmptyString(id)) fail("missing id");
  else if (seen.has(id.string)) fail(`duplicate SelfCheck id "${id.string}"`);
  else seen.add(id.string);

  if (!nonEmptyString(attr(node, "question"))) fail("missing question");
  if (!nonEmptyString(attr(node, "explanation"))) fail("missing explanation");

  const options = attr(node, "options");
  const answer = attr(node, "answer");
  const answerValue = literalNumber(answer);
  if (!Number.isFinite(answerValue)) fail("answer must be a plain number in braces, like answer={4.7}");

  if (options.present) {
    const list = typeof options.string === "string" ? lines(options.string) : [];
    if (list.length < 2) fail("multiple choice needs at least 2 options (one per line)");
    else if (Number.isFinite(answerValue) && (!Number.isInteger(answerValue) || answerValue < 0 || answerValue >= list.length)) {
      fail(`answer ${answerValue} is not one of the ${list.length} options (use 0 to ${list.length - 1})`);
    }
    if (nonEmptyString(id)) out.checks.push({ id: id.string, kind: "choice" });
    return;
  }

  if (Number.isFinite(answerValue) && answerValue === 0) {
    fail("numeric answer is zero, so a percentage tolerance can't be applied");
  }
  if (!attr(node, "unit").present) fail("numeric question is missing unit (use unit=\"\" if there is none)");
  const tolerance = literalNumber(attr(node, "tolerancePct"));
  if (!(Number.isFinite(tolerance) && tolerance > 0)) fail("numeric question needs tolerancePct={n} with n greater than 0");
  if (nonEmptyString(id)) out.checks.push({ id: id.string, kind: "number" });
}

function checkChecklist(node, out) {
  const items = attr(node, "items");
  if (!nonEmptyString(items)) {
    out.problems.push("Checklist: missing items");
    return;
  }
  const seen = new Set();
  for (const line of lines(items.string)) {
    const at = line.indexOf(" | ");
    const id = at > 0 ? line.slice(0, at).trim() : "";
    const text = at > 0 ? line.slice(at + 3).trim() : "";
    if (!id || !text) {
      out.problems.push(`Checklist: line "${line}" must look like: id | text`);
      continue;
    }
    if (seen.has(id)) out.problems.push(`Checklist: duplicate Checklist id "${id}"`);
    seen.add(id);
    out.checklist.push({ id, text });
  }
}

function checkKeyEquation(node, out) {
  if (!nonEmptyString(attr(node, "tex"))) out.problems.push("KeyEquation: missing tex");
  const where = attr(node, "where");
  if (!nonEmptyString(where)) {
    out.problems.push("KeyEquation: missing where");
    return;
  }
  for (const line of lines(where.string)) {
    if (line.split(" | ").length !== 3) {
      out.problems.push(`KeyEquation: line "${line}" must look like: symbol | meaning | unit`);
    }
  }
}

function checkWorkedExample(node, out) {
  if (!nonEmptyString(attr(node, "title"))) out.problems.push("WorkedExample: missing title");
  if (!(literalNumber(attr(node, "marks")) > 0)) out.problems.push("WorkedExample: needs marks={n} with n greater than 0");
  const steps = attr(node, "steps");
  if (!nonEmptyString(steps) || lines(steps.string).length < 2) {
    out.problems.push("WorkedExample: steps needs at least 2 lines (one step per line)");
  }
}

/** Check one notes file's source text. Never throws: parse errors are reported as problems. */
export function scanSource(source, label) {
  const out = { headings: [], checks: [], checklist: [], trySims: [], problems: [] };
  let tree;
  try {
    tree = processor.parse(source);
  } catch (error) {
    out.problems.push(`MDX does not parse: ${error.message}`);
    return prefix(out, label);
  }

  const slugger = new GithubSlugger();
  const seenChecks = new Set();

  walk(tree, (node) => {
    if (node.type === "heading") {
      const text = plainText(node).trim();
      const id = slugger.slug(text);
      if (node.depth === 2) {
        out.headings.push({ id, text });
        if (JSON.stringify(node).includes('"inlineMath"')) {
          out.problems.push(`heading "${text}" contains maths, which the contents list can't show`);
        }
      }
      return;
    }
    if (node.type !== "mdxJsxFlowElement" && node.type !== "mdxJsxTextElement") return;
    if (!COMPONENTS.has(node.name)) {
      out.problems.push(`unknown component <${node.name ?? ""}> (check the spelling)`);
      return;
    }
    if (node.name === "SelfCheck") checkSelfCheck(node, seenChecks, out);
    else if (node.name === "Checklist") checkChecklist(node, out);
    else if (node.name === "KeyEquation") checkKeyEquation(node, out);
    else if (node.name === "WorkedExample") checkWorkedExample(node, out);
    else if (node.name === "Definition" && !nonEmptyString(attr(node, "term"))) out.problems.push("Definition: missing term");
    else if (node.name === "TrySim") {
      const slug = attr(node, "slug");
      if (nonEmptyString(slug)) out.trySims.push(slug.string);
      else out.problems.push("TrySim: missing slug");
    }
  });

  return prefix(out, label);
}

function prefix(out, label) {
  return { ...out, problems: out.problems.map((p) => `${label}: ${p}`) };
}

/**
 * Scan every content/notes/*.mdx. Returns the index to save, the simulation slugs each
 * file links to, and every problem found.
 */
export function scanDir(dir) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort() : [];
  const index = {};
  const trySims = {};
  const problems = [];
  for (const file of files) {
    const topic = file.replace(/\.mdx$/, "");
    const result = scanSource(fs.readFileSync(path.join(dir, file), "utf8"), file);
    index[topic] = { headings: result.headings, checks: result.checks, checklist: result.checklist };
    trySims[topic] = result.trySims;
    problems.push(...result.problems);
  }
  return { index, trySims, problems };
}

export const serializeIndex = (index) => `${JSON.stringify(index, null, 2)}\n`;
