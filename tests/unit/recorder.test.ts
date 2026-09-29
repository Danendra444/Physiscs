import { describe, expect, it } from "vitest";
import { columnsFor, makeRow, recordBlockReason } from "@/lib/simkit/recorder";
import type { DerivedColumn, ParamSpec, Readouts } from "@/lib/simkit/types";

const params: ParamSpec[] = [
  { id: "m", label: "Mass", symbol: "m", unit: "kg", min: 0.1, max: 1, step: 0.1, default: 0.5, sf: 2 },
  { id: "v", label: "Speed", symbol: "v", unit: "m/s", min: 1, max: 5, step: 0.1, default: 2, sf: 2 },
];

const readouts: Readouts = {
  F: { label: "Force", symbol: "F", value: 1.23456, unit: "N", sf: 3 },
  a: { label: "Acceleration", symbol: "a", value: 9.87654, unit: "m/s²", sf: 3 },
};

const derived: DerivedColumn[] = [{ id: "v2", label: "v²", unit: "m²/s²", compute: (r) => r.v * r.v }];

const sim = { params, recordable: ["F"], derivedColumns: derived };

describe("columnsFor", () => {
  it("lists params, then recordable readouts, then derived columns", () => {
    const cols = columnsFor(sim, readouts);
    expect(cols.map((c) => c.id)).toEqual(["m", "v", "F", "v2"]);
    expect(cols.map((c) => c.source)).toEqual(["param", "param", "readout", "derived"]);
    expect(cols[2]).toMatchObject({ label: "F", unit: "N" });
    expect(cols[3]).toMatchObject({ label: "v²", unit: "m²/s²" });
  });
});

describe("recordBlockReason", () => {
  it("allows recording when every recordable value is known", () => {
    expect(recordBlockReason({ ...sim, recordBlocker: undefined }, {}, {}, readouts)).toBeNull();
  });

  it("asks the student to wait while a value is still being measured", () => {
    const pending = { ...readouts, F: { ...readouts.F, value: NaN } };
    expect(recordBlockReason({ ...sim, recordBlocker: undefined }, {}, {}, pending)).toMatch(/Wait until F/);
  });

  it("uses the simulation's own reason first", () => {
    const blocked = { ...sim, recordBlocker: () => "The string is cut." };
    expect(recordBlockReason(blocked, {}, {}, readouts)).toBe("The string is cut.");
  });
});

describe("makeRow", () => {
  it("records values rounded to their significant figures, then computes derived columns", () => {
    const row = makeRow(sim, { m: 0.5, v: 2.04 }, readouts);
    expect(row).toEqual({ m: 0.5, v: 2.0, F: 1.23, v2: 4.0 });
  });

  it("only records readouts listed as recordable", () => {
    const row = makeRow(sim, { m: 0.5, v: 2 }, readouts);
    expect(row).not.toHaveProperty("a");
  });
});
