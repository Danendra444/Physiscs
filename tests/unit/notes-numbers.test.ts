import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Every number in the worked examples and self-checks is recomputed here from the
// question's own inputs, so a typo in a note can't reach students unnoticed.

const dir = fileURLToPath(new URL("../../content/notes/", import.meta.url));
const read = (topic: string) => fs.readFileSync(`${dir}${topic}.mdx`, "utf8");

const G = 6.67e-11;
const g = 9.81;
const M = 5.97e24;
const R = 6.37e6;
const GM = G * M;
const PI = Math.PI;

/** n significant figures as text, keeping trailing zeros like the notes do: sig(4, 2) = "4.0". */
const sig = (x: number, n: number) => x.toPrecision(n);
/** "7.54 \\times 10^{3}", the way the notes write large and small numbers. */
const sci = (x: number, n = 3) => {
  const e = Math.floor(Math.log10(Math.abs(x)));
  return `${sig(x / 10 ** e, n)} \\times 10^{${e}}`;
};

/** id → answer for every numeric or multiple-choice SelfCheck. */
function answers(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of text.matchAll(/<SelfCheck\s+id="([^"]+)"[\s\S]*?answer=\{([^}]+)\}/g)) out[m[1]] = Number(m[2]);
  return out;
}

function expectAnswers(topic: string, expected: Record<string, number>, relTolerance = 0.001) {
  const found = answers(read(topic));
  expect(Object.keys(found).sort()).toEqual(Object.keys(expected).sort());
  for (const [id, want] of Object.entries(expected)) {
    expect(Math.abs(found[id] - want) / Math.abs(want || 1), `${topic}/${id}: ${found[id]} vs ${want}`).toBeLessThanOrEqual(
      relTolerance,
    );
  }
}

function expectText(topic: string, snippets: string[]) {
  const text = read(topic);
  for (const s of snippets) expect(text, `${topic} should contain: ${s}`).toContain(s);
}

describe("Motion in a circle: numbers", () => {
  const omega = (2 * PI) / 0.5;
  it("self-check answers", () => {
    expectAnswers("circular-motion", {
      "unit-omega": 1, // rad s⁻¹
      "wheel-omega": (45 * 2 * PI) / 60,
      "centripetal-acceleration": 20 ** 2 / 40,
      "resultant-direction": 2, // towards the centre
      "centripetal-force-value": 0.25 * 0.4 * 6 ** 2,
      "double-speed": 1, // four times as large
    });
  });
  it("worked example results", () => {
    expectText("circular-motion", [
      `${sig(omega, 3)}\\ \\text{rad s}^{-1}`,
      `${sig(0.8 * omega, 3)}\\ \\text{m s}^{-1}`,
      `${sig(0.05 * 0.8 * omega ** 2, 3)}\\ \\text{N}`,
      `${sig(Math.sqrt((6000 * 50) / 1200), 3)}\\ \\text{m s}^{-1}`,
      `${sig(6000 * 50 / 1200, 3)}\\ \\text{m}^2`,
      `about ${Math.round(Math.sqrt(250) * 3.6)} $\\text{km h}^{-1}$`,
      `${sig(0.2 * (g + 4 ** 2 / 0.6), 2)}\\ \\text{N}`,
      `0.20 \\times ${sig(g + 4 ** 2 / 0.6, 4)}`,
      `(${sig(omega, 5)})^2`,
    ]);
  });
});

describe("Gravitational fields: numbers", () => {
  const rIss = R + 4e5;
  const rGeo = Math.cbrt((GM * 86400 ** 2) / (4 * PI ** 2));
  it("self-check answers", () => {
    expectAnswers("gravitational-fields", {
      "g-value": GM / 1e7 ** 2,
      "g-double-r": 1, // one quarter
      "orbit-speed-r4": 2, // half
      "kepler-ratio": 2 * 4 ** 1.5,
      "potential-sign": 1,
      "potential-surface": -GM / R,
    });
  });
  it("worked example results", () => {
    const v = Math.sqrt(GM / 7e6);
    const T = (2 * PI * 7e6) / v;
    const dPhi = GM * (1 / R - 1 / 7e6);
    expectText("gravitational-fields", [
      `${sig(rIss / 1e6, 3)} \\times 10^6\\ \\text{m}`,
      `${sig(GM / rIss ** 2, 3)}\\ \\text{N kg}^{-1}`,
      `about ${Math.round((R / rIss) ** 2 * 100)}% of the value at the surface`,
      `${sci(v)}\\ \\text{m s}^{-1}`,
      `${sci(T)}\\ \\text{s}`,
      `about ${sig(T / 3600, 3)} hours`,
      `${sig(rGeo ** 3 / 1e22, 3)} \\times 10^{22}\\ \\text{m}^3`,
      `${sci(rGeo)}\\ \\text{m}`,
      `${sci(rGeo - R)}\\ \\text{m}`,
      `${sig(rGeo / 1e7, 4)} \\times 10^{7}`,
      `GM = 6.67 \\times 10^{-11} \\times 5.97 \\times 10^{24} = ${sci(GM, 4)}`,
      `${sci(dPhi)}\\ \\text{J kg}^{-1}`,
      `${sci(1000 * dPhi)}\\ \\text{J}`,
      `-6.25 \\times 10^{7}`,
      sci(-GM / 7e6),
    ]);
  });
  it("sidereal-day claim: less than 0.2% change in the geostationary radius", () => {
    const sidereal = Math.cbrt((GM * 86164 ** 2) / (4 * PI ** 2));
    expect(Math.abs(sidereal - rGeo) / rGeo).toBeLessThan(0.002);
  });
});

describe("Oscillations: numbers", () => {
  const omega = Math.sqrt(20 / 0.5);
  it("self-check answers", () => {
    expectAnswers("oscillations", {
      "shm-equilibrium": 1,
      "omega-from-f": 2 * PI * 2.5,
      "spring-period": 2 * PI * Math.sqrt(2 / 50),
      "max-acceleration": 5 ** 2 * 0.04,
      "energy-amplitude": 1,
      resonance: 1,
    });
  });
  it("worked example results", () => {
    expectText("oscillations", [
      `${sig(omega, 3)}\\ \\text{rad s}^{-1}`,
      `${sig((2 * PI) / omega, 3)}\\ \\text{s}`,
      `${sig(omega * 0.1, 3)}\\ \\text{m s}^{-1}`,
      `${sig(omega ** 2 * 0.1, 2)}\\ \\text{m s}^{-2}`,
      `${sig(0.5 * 20 * 0.1 ** 2, 2)}\\ \\text{J}`,
      `${sig(8 * Math.sqrt(0.05 ** 2 - 0.03 ** 2), 2)}\\ \\text{m s}^{-1}`,
      `${sig((4 * PI ** 2) / 1.97, 3)}\\ \\text{N m}^{-1}`,
      `\\omega = 2\\pi f = 2\\pi \\times 2.5 = ${sig(2 * PI * 2.5, 3)}`,
    ]);
  });
  it("energy fractions in the half-amplitude example add up", () => {
    const x0 = 1;
    const ep = 0.5 * (x0 / 2) ** 2;
    const total = 0.5 * x0 ** 2;
    expect(ep / total).toBeCloseTo(1 / 4, 12);
    expect((total - ep) / total).toBeCloseTo(3 / 4, 12);
  });
});
