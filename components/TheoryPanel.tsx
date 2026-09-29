import type { TheoryContent } from "@/lib/simkit/types";
import { MathBlock, MathText } from "./MathText";

/** Key equations and explanations, collapsed by default so they don't crowd the simulation. */
export function TheoryPanel({ theory }: { theory: TheoryContent }) {
  return (
    <details className="card group p-4">
      <summary className="cursor-pointer list-none font-semibold">
        <span className="mr-2 inline-block transition-transform group-open:rotate-90">▸</span>
        Theory: key equations and syllabus outcomes
      </summary>
      <div className="mt-4 space-y-5">
        <p>
          <MathText text={theory.summary} />
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {theory.equations.map((e) => (
            <div key={e.tex} className="rounded-lg bg-page px-3 py-2">
              <MathBlock tex={e.tex} />
              <p className="text-center text-xs text-muted">{e.caption}</p>
            </div>
          ))}
        </div>
        {theory.sections.map((s) => (
          <section key={s.heading}>
            <h3 className="mb-1 font-medium">{s.heading}</h3>
            <p className="text-sm leading-relaxed">
              <MathText text={s.body} />
            </p>
          </section>
        ))}
        <section>
          <h3 className="mb-1 font-medium">Cambridge 9702 learning outcomes</h3>
          <ul className="space-y-1 text-sm">
            {theory.outcomes.map((o, i) => (
              <li key={i}>
                <span className="mr-2 font-mono text-accent">{o.code}</span>
                {o.text}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </details>
  );
}
