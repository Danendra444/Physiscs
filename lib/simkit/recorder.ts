import { toSigFigs } from "./format";
import type { Column, Params, Readouts, Row, SimDefinition } from "./types";

type RecordingSim = Pick<SimDefinition, "params" | "recordable" | "derivedColumns">;

/** Columns of the data table: parameters, then recordable readouts, then derived columns. */
export function columnsFor(sim: RecordingSim, readouts: Readouts): Column[] {
  return [
    ...sim.params.map((p) => ({ id: p.id, label: p.symbol, unit: p.unit, source: "param" as const })),
    ...sim.recordable.map((id) => ({
      id,
      label: readouts[id]?.symbol ?? id,
      unit: readouts[id]?.unit ?? "",
      source: "readout" as const,
    })),
    ...sim.derivedColumns.map((d) => ({ id: d.id, label: d.label, unit: d.unit, source: "derived" as const })),
  ];
}

/**
 * Snapshot the current parameters and readouts as one row of the data table.
 * Values are rounded to the significant figures shown on screen, like a real reading,
 * and derived columns are computed from those rounded values.
 */
export function makeRow(sim: RecordingSim, params: Params, readouts: Readouts): Row {
  const row: Row = {};
  for (const p of sim.params) row[p.id] = toSigFigs(params[p.id], p.sf);
  for (const id of sim.recordable) {
    const q = readouts[id];
    if (q) row[id] = toSigFigs(q.value, q.sf);
  }
  for (const d of sim.derivedColumns) row[d.id] = d.compute(row);
  return row;
}
