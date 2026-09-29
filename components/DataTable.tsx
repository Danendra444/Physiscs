"use client";

import { formatNumber } from "@/lib/simkit/format";
import type { Column, Row } from "@/lib/simkit/types";

export const heading = (c: Column) => (c.unit ? `${c.label} / ${c.unit}` : c.label);

interface Props {
  columns: Column[];
  rows: Row[];
  onDelete?: (index: number) => void;
  onClear?: () => void;
  fileName?: string;
}

function toCsv(columns: Column[], rows: Row[]) {
  const quote = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [columns.map((c) => quote(heading(c))).join(",")];
  for (const r of rows) lines.push(columns.map((c) => String(r[c.id])).join(","));
  return lines.join("\n");
}

export function DataTable({ columns, rows, onDelete, onClear, fileName = "data" }: Props) {
  const download = () => {
    const blob = new Blob([toCsv(columns, rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-sm" data-testid="data-table">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-1.5 pr-2 font-medium text-muted">#</th>
              {columns.map((c) => (
                <th
                  key={c.id}
                  className={`py-1.5 pr-3 font-medium whitespace-nowrap ${c.source === "derived" ? "text-accent" : ""}`}
                >
                  {heading(c)}
                </th>
              ))}
              {onDelete && <th className="sr-only">Delete</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="py-4 text-center text-muted">
                  No readings yet. Set the sliders, then press Record reading.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="py-1.5 pr-2 text-muted">{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.id} className="py-1.5 pr-3 font-mono whitespace-nowrap tabular-nums">
                    {formatNumber(r[c.id], c.sf)}
                  </td>
                ))}
                {onDelete && (
                  <td className="py-1 text-right">
                    <button
                      type="button"
                      className="rounded px-1.5 text-muted hover:text-bad"
                      onClick={() => onDelete(i)}
                      aria-label={`Delete reading ${i + 1}`}
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(onClear || rows.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2 screen-only">
          <button type="button" className="btn" onClick={download} disabled={rows.length === 0}>
            Download CSV
          </button>
          {onClear && (
            <button
              type="button"
              className="btn"
              disabled={rows.length === 0}
              onClick={() => {
                if (window.confirm("Delete all readings in the table?")) onClear();
              }}
            >
              Clear table
            </button>
          )}
        </div>
      )}
      <p className="mt-2 text-xs text-muted">Columns in blue are calculated from your readings.</p>
    </div>
  );
}
