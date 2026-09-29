"use client";

import { MathText } from "../MathText";
import { useNotes } from "./NotesProvider";

/** "I can…" statements the student ticks off. Each line of `items` is "id | text". */
export function Checklist({ items }: { items: string }) {
  const { progress, toggle } = useNotes();
  const rows = items
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const at = line.indexOf(" | ");
      return { id: line.slice(0, at).trim(), text: line.slice(at + 3).trim() };
    });
  const done = rows.filter((r) => progress.checklist[r.id]).length;

  return (
    <div className="card my-5 p-4" data-testid="checklist">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">Can you do all of these?</p>
        <p className="text-sm text-muted no-print" aria-live="polite">
          {done} of {rows.length} ticked
        </p>
      </div>
      <ul className="mt-3 space-y-1.5 pl-0">
        {rows.map((r) => (
          <li key={r.id} className="list-none">
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={progress.checklist[r.id] ?? false}
                onChange={() => toggle(r.id)}
              />
              <MathText text={r.text} />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
