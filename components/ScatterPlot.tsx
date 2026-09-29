import { axisFor } from "@/lib/simkit/axis";
import type { LinearFit } from "@/lib/simkit/fit";
import type { Column } from "@/lib/simkit/types";

const W = 520;
const H = 320;
const M = { left: 64, right: 16, top: 16, bottom: 48 };

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const pow10 = (e: number) => `10${String(e).split("").map((c) => SUP[c]).join("")}`;

/** Cambridge-style axis label, e.g. "r³ / 10²³ m³". */
function axisLabel(c: Column, exponent: number) {
  const factor = exponent !== 0 ? `${pow10(exponent)} ` : "";
  const unit = `${factor}${c.unit}`.trim();
  return unit ? `${c.label} / ${unit}` : c.label;
}

const tickText = (v: number, exponent: number) => String(Number((v / 10 ** exponent).toPrecision(6)));

interface Props {
  xs: number[];
  ys: number[];
  xCol: Column;
  yCol: Column;
  fit: LinearFit | null;
}

/** Data points with an optional best-fit line, drawn as SVG so it also prints cleanly in the hand-in. */
export function ScatterPlot({ xs, ys, xCol, yCol, fit }: Props) {
  const ax = axisFor(xs);
  const ay = axisFor(ys);
  const px = (x: number) => M.left + ((x - ax.min) / (ax.max - ax.min)) * (W - M.left - M.right);
  const py = (y: number) => H - M.bottom - ((y - ay.min) / (ay.max - ay.min)) * (H - M.top - M.bottom);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Graph of ${yCol.label} against ${xCol.label} with ${xs.length} points${fit ? " and a best-fit line" : ""}`}
    >
      <defs>
        <clipPath id="plot-area">
          <rect x={M.left} y={M.top} width={W - M.left - M.right} height={H - M.top - M.bottom} />
        </clipPath>
      </defs>
      {ax.ticks.map((t) => (
        <g key={`x${t}`}>
          <line x1={px(t)} x2={px(t)} y1={M.top} y2={H - M.bottom} stroke="var(--line)" />
          <text x={px(t)} y={H - M.bottom + 16} textAnchor="middle" fontSize="11" fill="var(--muted)">
            {tickText(t, ax.exponent)}
          </text>
        </g>
      ))}
      {ay.ticks.map((t) => (
        <g key={`y${t}`}>
          <line x1={M.left} x2={W - M.right} y1={py(t)} y2={py(t)} stroke="var(--line)" />
          <text x={M.left - 6} y={py(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
            {tickText(t, ay.exponent)}
          </text>
        </g>
      ))}
      <line x1={M.left} x2={W - M.right} y1={py(0)} y2={py(0)} stroke="var(--muted)" />
      <line x1={px(0)} x2={px(0)} y1={M.top} y2={H - M.bottom} stroke="var(--muted)" />
      <text x={(M.left + W - M.right) / 2} y={H - 8} textAnchor="middle" fontSize="13" fill="var(--ink)">
        {axisLabel(xCol, ax.exponent)}
      </text>
      <text
        transform={`translate(14 ${(M.top + H - M.bottom) / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize="13"
        fill="var(--ink)"
      >
        {axisLabel(yCol, ay.exponent)}
      </text>
      {fit && (
        <line
          clipPath="url(#plot-area)"
          x1={px(ax.min)}
          y1={py(fit.gradient * ax.min + fit.intercept)}
          x2={px(ax.max)}
          y2={py(fit.gradient * ax.max + fit.intercept)}
          stroke="var(--accent)"
          strokeWidth="2"
        />
      )}
      {xs.map((x, i) => (
        <g key={i} stroke="var(--ink)" strokeWidth="1.5">
          <line x1={px(x) - 4} y1={py(ys[i]) - 4} x2={px(x) + 4} y2={py(ys[i]) + 4} />
          <line x1={px(x) - 4} y1={py(ys[i]) + 4} x2={px(x) + 4} y2={py(ys[i]) - 4} />
        </g>
      ))}
    </svg>
  );
}
