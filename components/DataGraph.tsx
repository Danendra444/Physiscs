"use client";

import { linearFit } from "@/lib/simkit/fit";
import { formatNumber } from "@/lib/simkit/format";
import type { Column, Row } from "@/lib/simkit/types";
import { heading } from "./DataTable";
import { ScatterPlot } from "./ScatterPlot";

interface Props {
  columns: Column[];
  rows: Row[];
  axes: { x: string; y: string };
  onAxes: (axes: { x: string; y: string }) => void;
}

export function gradientUnit(x: Column, y: Column) {
  if (!x.unit) return y.unit;
  if (!y.unit) return `(${x.unit})⁻¹`;
  return `${y.unit} / ${x.unit}`;
}

/** The student picks what to plot; the best-fit line and its gradient are calculated for them. */
export function DataGraph({ columns, rows, axes, onAxes }: Props) {
  const xCol = columns.find((c) => c.id === axes.x) ?? columns[0];
  const yCol = columns.find((c) => c.id === axes.y) ?? columns[1];
  const xs = rows.map((r) => r[xCol.id]);
  const ys = rows.map((r) => r[yCol.id]);
  const fit = linearFit(xs, ys);

  const select = (axis: "x" | "y", value: string) => onAxes({ ...axes, [axis]: value });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted">y-axis</span>
          <select
            className="rounded-md border border-line bg-surface px-2 py-1"
            value={yCol.id}
            onChange={(e) => select("y", e.target.value)}
            data-testid="axis-y"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {heading(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-muted">x-axis</span>
          <select
            className="rounded-md border border-line bg-surface px-2 py-1"
            value={xCol.id}
            onChange={(e) => select("x", e.target.value)}
            data-testid="axis-x"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {heading(c)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ScatterPlot xs={xs} ys={ys} xCol={xCol} yCol={yCol} fit={fit} />
      <p className="mt-2 font-mono text-sm tabular-nums">
        {fit ? (
          <>
            gradient = {formatNumber(fit.gradient, 3)} {gradientUnit(xCol, yCol)} · y-intercept ={" "}
            {formatNumber(fit.intercept, 3)} {yCol.unit} · r² = {fit.r2.toFixed(4)}
          </>
        ) : (
          <span className="text-muted">Record at least 2 readings with different x-values to see a best-fit line.</span>
        )}
      </p>
    </div>
  );
}
