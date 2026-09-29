import { toSigFigs } from "./format";
import type { Column, Params, Readouts, Row, SimDefinition } from "./types";

type RecordingSim = Pick<SimDefinition, "params" | "recordable" | "derivedColumns">;

/** Columns of the data table: parameters, then recordable readouts, then derived columns. */
export function columnsFor(sim: RecordingSim, readouts: Readouts): Column[] {
  return [
    ...sim.params.map((p) => ({ id: p.id, label: p.symbol, unit: p.unit, sf: p.sf, source: "param" as const })),
    ...sim.recordable.map((id) => ({
      id,
      label: readouts[id]?.symbol ?? id,
      unit: readouts[id]?.unit ?? "",
      sf: readouts[id]?.sf ?? 3,
      source: "readout" as const,
    })),
    ...sim.derivedColumns.map((d) => ({ id: d.id, label: d.label, unit: d.unit, sf: 3, source: "derived" as const })),
  ];
}

/** Why a reading can't be recorded right now, or null if it can. */
export function recordBlockReason<S>(
  sim: RecordingSim & Pick<SimDefinition<S>, "recordBlocker">,
  state: S,
  params: Params,
  readouts: Readouts,
): string | null {
  const own = sim.recordBlocker?.(state, params);
  if (own) return own;
  for (const id of sim.recordable) {
    const q = readouts[id];
    if (q && !Number.isFinite(q.value)) {
      return `Wait until ${q.symbol} has been measured: keep the simulation running for at least one full cycle.`;
    }
  }
  return null;
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
