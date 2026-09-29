import type { ReactNode } from "react";
import { MathBlock, MathText } from "../MathText";

/** A definition in the wording a mark scheme expects. */
export function Definition({ term, children }: { term: string; children: ReactNode }) {
  return (
    <aside className="notes-callout my-5 rounded-lg border-l-4 border-accent bg-accent-soft px-4 py-3" data-testid="definition">
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">Definition: learn this wording</p>
      <p className="mt-1 font-semibold">{term}</p>
      <div className="mt-1">{children}</div>
    </aside>
  );
}

export function CommonMistake({ children }: { children: ReactNode }) {
  return (
    <aside className="notes-callout my-5 rounded-lg border-l-4 border-bad bg-bad-soft px-4 py-3" data-testid="common-mistake">
      <p className="text-xs font-semibold tracking-wide text-bad uppercase">Common mistake</p>
      <div className="mt-1">{children}</div>
    </aside>
  );
}

export function ExamTip({ children }: { children: ReactNode }) {
  return (
    <aside className="notes-callout my-5 rounded-lg border-l-4 border-warn bg-warn-soft px-4 py-3" data-testid="exam-tip">
      <p className="text-xs font-semibold tracking-wide text-warn uppercase">Exam tip</p>
      <div className="mt-1">{children}</div>
    </aside>
  );
}

/**
 * An equation with a table explaining each symbol.
 * `where` has one row per line: "symbol | meaning | unit" (symbol is TeX, e.g. \omega).
 */
export function KeyEquation({ tex, where }: { tex: string; where: string }) {
  const rows = where
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(" | ").map((part) => part.trim()));

  return (
    <figure className="notes-equation card my-5 p-4" data-testid="key-equation">
      <MathBlock tex={tex} />
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th className="py-1 pr-3 font-medium">Symbol</th>
            <th className="py-1 pr-3 font-medium">Meaning</th>
            <th className="py-1 font-medium">Unit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([symbol, meaning, unit], i) => (
            <tr key={i} className="border-b border-line/60 last:border-0">
              <td className="py-1 pr-3">
                <MathText text={`$${symbol}$`} />
              </td>
              <td className="py-1 pr-3">
                <MathText text={meaning} />
              </td>
              <td className="py-1 font-mono">{unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
