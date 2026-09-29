"use client";

import { useState } from "react";
import { MathText } from "../MathText";

interface Props {
  title: string;
  marks: number;
  /** One step per line; inline maths between $…$. The last step should be the final answer. */
  steps: string;
  /** The question, written as normal MDX. */
  children: React.ReactNode;
}

/** A solved problem whose working is revealed one step at a time. All steps show when printing. */
export function WorkedExample({ title, marks, steps, children }: Props) {
  const list = steps.split("\n").map((s) => s.trim()).filter(Boolean);
  const [shown, setShown] = useState(0);
  const all = shown >= list.length;

  return (
    <section className="notes-example card my-6 p-4" data-testid="worked-example">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="mt-0 mb-0 text-base font-semibold">Worked example: {title}</h3>
        <span className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent">
          [{marks} mark{marks === 1 ? "" : "s"}]
        </span>
      </header>

      <div className="mt-3">{children}</div>

      <ol className="mt-3 space-y-2 border-t border-line pt-3" aria-label="Worked solution">
        {list.map((step, i) => (
          <li key={i} className={i < shown ? "" : "step-hidden"} data-testid={i < shown ? "step-shown" : undefined}>
            <MathText text={step} />
          </li>
        ))}
      </ol>

      <div className="no-print mt-3 flex flex-wrap gap-2">
        {!all && (
          <>
            <button type="button" className="btn" onClick={() => setShown((n) => n + 1)}>
              {shown === 0 ? "Show first step" : "Show next step"}
            </button>
            <button type="button" className="btn" onClick={() => setShown(list.length)}>
              Show all steps
            </button>
          </>
        )}
        {shown > 0 && (
          <button type="button" className="btn" onClick={() => setShown(0)}>
            Hide steps
          </button>
        )}
        <span className="self-center text-sm text-muted">
          {shown} of {list.length} steps shown
        </span>
      </div>
    </section>
  );
}
