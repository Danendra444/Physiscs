import { evaluateAnalyse, gradeChoice, type Labels } from "@/lib/simkit/activity";
import { linearFit } from "@/lib/simkit/fit";
import { formatNumber } from "@/lib/simkit/format";
import type { SimProgress } from "@/lib/simkit/storage";
import type { AnySim, Column } from "@/lib/simkit/types";
import { gradientUnit } from "./DataGraph";
import { DataTable } from "./DataTable";
import { MathText } from "./MathText";
import { ScatterPlot } from "./ScatterPlot";

interface Props {
  sim: AnySim;
  progress: SimProgress;
  columns: Column[];
  labels: Labels;
  axes: { x: string; y: string };
}

/** The printable summary a student hands in. Only visible when printing. */
export function HandIn({ sim, progress, columns, labels, axes }: Props) {
  const steps = sim.content.activity.steps;
  const xCol = columns.find((c) => c.id === axes.x) ?? columns[0];
  const yCol = columns.find((c) => c.id === axes.y) ?? columns[1];
  const xs = progress.rows.map((r) => r[xCol.id]);
  const ys = progress.rows.map((r) => r[yCol.id]);
  const fit = linearFit(xs, ys);
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <article className="print-only space-y-5 text-[11pt] leading-snug">
      <header className="border-b border-line pb-3">
        <h1 className="text-xl font-bold">{sim.title}</h1>
        <p>{sim.content.activity.title}</p>
        <p className="mt-1 text-sm">
          Name: <strong>{progress.studentName || "____________________"}</strong> · Date: {date} · Physics Sim Lab ·
          9702 {sim.syllabusRefs.join(", ")}
        </p>
        {progress.freePlay && <p className="text-sm italic">Free play was switched on during this session.</p>}
      </header>

      {steps.map((step) => {
        if (step.kind === "predict") {
          const a = progress.answers[step.id];
          return (
            <section key={step.id}>
              <h2 className="font-semibold">Prediction</h2>
              <p>
                <MathText text={step.question} />
              </p>
              <p>
                My prediction: {a === undefined ? "(not answered)" : <MathText text={step.options[a]} />}
                {a !== undefined && (gradeChoice(step, a) ? " ✓" : ` ✗ (answer: ${step.options[step.correctIndex]})`)}
              </p>
            </section>
          );
        }
        if (step.kind === "task") {
          return (
            <section key={step.id}>
              <h2 className="font-semibold">Readings</h2>
              <p className="mb-2">
                <MathText text={step.instruction} />
              </p>
              <DataTable columns={columns} rows={progress.rows} />
            </section>
          );
        }
        if (step.kind === "analyse") {
          const res = evaluateAnalyse(step, progress.rows, axes, labels);
          return (
            <section key={step.id} className="break-inside-avoid">
              <h2 className="font-semibold">Graph</h2>
              <div className="max-w-[16cm]">
                <ScatterPlot xs={xs} ys={ys} xCol={xCol} yCol={yCol} fit={fit} />
              </div>
              {fit && (
                <p className="font-mono text-sm">
                  gradient = {formatNumber(fit.gradient, 3)} {gradientUnit(xCol, yCol)}, y-intercept ={" "}
                  {formatNumber(fit.intercept, 3)} {yCol.unit}, r² = {fit.r2.toFixed(4)}
                </p>
              )}
              <p className="text-sm">
                {res.ok ? "✓ " : "✗ "}
                <MathText text={res.message} />
              </p>
            </section>
          );
        }
        const a = progress.answers[step.id];
        return (
          <section key={step.id} className="break-inside-avoid">
            <h2 className="font-semibold">Conclusion</h2>
            <p>
              <MathText text={step.question} />
            </p>
            <p>
              My answer: {a === undefined ? "(not answered)" : step.options[a]}
              {a !== undefined && (gradeChoice(step, a) ? " ✓" : " ✗")}
            </p>
            <p className="mt-2 font-medium">
              <MathText text={step.prompt} />
            </p>
            <p className="whitespace-pre-wrap rounded border border-line p-2">
              {progress.explanation || "(no explanation written)"}
            </p>
          </section>
        );
      })}
    </article>
  );
}
