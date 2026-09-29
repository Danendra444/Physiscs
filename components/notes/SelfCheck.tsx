"use client";

import { useState } from "react";
import { checkNumeric, revealsExplanation } from "@/lib/notes/answer";
import { formatNumber } from "@/lib/simkit/format";
import { MathText } from "../MathText";
import { useNotes } from "./NotesProvider";

interface Props {
  id: string;
  question: string;
  /** One option per line. Leave out for a numeric question. */
  options?: string;
  /** Index of the correct option (multiple choice), or the true value (numeric). */
  answer: number;
  unit?: string;
  tolerancePct?: number;
  explanation: string;
}

/** A short question with instant marking. The result is saved, so the topic hub can show progress. */
export function SelfCheck({ id, question, options, answer, unit = "", tolerancePct = 2, explanation }: Props) {
  const { progress, attempt } = useNotes();
  const saved = progress.checks[id];
  const list = options ? options.split("\n").map((o) => o.trim()).filter(Boolean) : null;

  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [message, setMessage] = useState<{ tone: "bad" | "warn"; text: string } | null>(null);

  const correct = saved?.correct ?? false;
  const showExplanation = revealsExplanation(saved);
  const correctText = list ? list[answer] : `${formatNumber(answer, 3)}${unit ? ` ${unit}` : ""}`;

  const check = (event: React.FormEvent) => {
    event.preventDefault();
    if (list) {
      if (choice === null) return setMessage({ tone: "warn", text: "Choose an answer first." });
      const ok = choice === answer;
      attempt(id, ok);
      setMessage(ok ? null : { tone: "bad", text: "Not quite. Have another look and try again." });
      return;
    }
    const result = checkNumeric(text, answer, tolerancePct);
    if (result === "invalid") return setMessage({ tone: "warn", text: "Enter a number, like 4.7 or 3×10^8." });
    attempt(id, result === "correct");
    setMessage(result === "correct" ? null : { tone: "bad", text: "Not quite. Check your working and try again." });
  };

  return (
    <div className="notes-selfcheck card my-5 p-4" data-testid="selfcheck" data-selfcheck={id}>
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">Quick check</p>
      <p className="mt-1 font-medium">
        <MathText text={question} />
      </p>

      {list && (
        <ol className="print-only mt-2 list-[upper-alpha] pl-6">
          {list.map((o, i) => (
            <li key={i}>
              <MathText text={o} />
            </li>
          ))}
        </ol>
      )}

      <div className="no-print">
        {!correct && (
          <form onSubmit={check} className="mt-3 space-y-2" noValidate>
            {list ? (
              <fieldset className="space-y-1.5">
                <legend className="sr-only">Choose an answer</legend>
                {list.map((o, i) => (
                  <label
                    key={i}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${choice === i ? "border-accent bg-accent-soft" : "border-line"}`}
                  >
                    <input
                      type="radio"
                      name={`sc-${id}`}
                      className="mt-0.5"
                      checked={choice === i}
                      onChange={() => {
                        setChoice(i);
                        setMessage(null);
                      }}
                    />
                    <MathText text={o} />
                  </label>
                ))}
              </fieldset>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label htmlFor={`sc-${id}`} className="text-muted">
                  Your answer
                </label>
                <input
                  id={`sc-${id}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setMessage(null);
                  }}
                  className="w-32 rounded-lg border border-line bg-surface px-2 py-1.5 font-mono"
                />
                {unit && <span className="font-mono">{unit}</span>}
              </div>
            )}
            <button type="submit" className="btn">
              Check answer
            </button>
          </form>
        )}

        {message && (
          <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm ${message.tone === "bad" ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn"}`}>
            {message.text}
          </p>
        )}

        {correct && (
          <p role="status" className="mt-3 rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">
            <strong>Correct.</strong> Answer: <MathText text={correctText} />
          </p>
        )}
        {!correct && showExplanation && (
          <p className="mt-3 text-sm">
            The answer is <strong><MathText text={correctText} /></strong>.
          </p>
        )}
        {showExplanation && (
          <p className="mt-2 text-sm text-muted" data-testid="selfcheck-explanation">
            <MathText text={explanation} />
          </p>
        )}
      </div>
    </div>
  );
}
