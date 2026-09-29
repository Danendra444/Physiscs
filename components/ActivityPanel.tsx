"use client";

import { useState } from "react";
import { evaluateAnalyse, evaluateTask, gradeChoice, type Labels } from "@/lib/simkit/activity";
import type { SimProgress } from "@/lib/simkit/storage";
import type { ActivityStep, AnalyseStep, ExplainStep, PredictStep, Row, TaskStep } from "@/lib/simkit/types";
import { MathText } from "./MathText";

const KIND_NAME: Record<ActivityStep["kind"], string> = {
  predict: "Predict",
  task: "Test",
  analyse: "Analyse",
  explain: "Explain",
};

export const revealKey = (id: string) => `${id}:revealed`;
const MIN_EXPLANATION = 20;

interface Props {
  title: string;
  steps: ActivityStep[];
  progress: SimProgress;
  update: (fn: (p: SimProgress) => SimProgress) => void;
  labels: Labels;
  axes: { x: string; y: string };
  /** True once the simulation has been played since the prediction was made. */
  hasTested: boolean;
  onHandIn: () => void;
  onRestart: () => void;
}

function Feedback({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className={`rounded-lg px-3 py-2 text-sm ${ok ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`}
    >
      {children}
    </div>
  );
}

function Choices({
  name,
  options,
  value,
  onChange,
  disabled,
}: {
  name: string;
  options: string[];
  value: number | null;
  onChange: (i: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {options.map((o, i) => (
        <label
          key={i}
          className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${value === i ? "border-accent bg-accent-soft" : "border-line"} ${disabled ? "cursor-default" : ""}`}
        >
          <input
            type="radio"
            name={name}
            className="mt-0.5"
            checked={value === i}
            disabled={disabled}
            onChange={() => onChange(i)}
          />
          <MathText text={o} />
        </label>
      ))}
    </div>
  );
}

export function ActivityPanel(props: Props) {
  const { steps, progress, update } = props;
  const index = progress.stepIndex;
  const done = index >= steps.length;
  const step = steps[Math.min(index, steps.length - 1)];

  const go = (delta: number) => update((p) => ({ ...p, stepIndex: Math.max(0, Math.min(steps.length, p.stepIndex + delta)) }));
  const setAnswer = (key: string, value: number) => update((p) => ({ ...p, answers: { ...p.answers, [key]: value } }));

  if (progress.freePlay) {
    return (
      <div className="space-y-3 text-sm">
        <p>
          <strong>Free play is on.</strong> Everything is unlocked, so explore as you like.
        </p>
        <button type="button" className="btn" onClick={() => update((p) => ({ ...p, freePlay: false }))}>
          Back to the activity
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">{props.title}</h2>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i < index || done ? "bg-ok" : i === index ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {done ? "Activity complete" : `Step ${index + 1} of ${steps.length} · ${KIND_NAME[step.kind]}`}
        </p>
      </div>

      {done ? (
        <div className="space-y-3">
          <Feedback ok>Well done, you&apos;ve finished the activity.</Feedback>
          <p className="text-sm text-muted">
            Download a summary of your prediction, data, graph and explanation to hand in. Choose &quot;Save as PDF&quot; in
            the print dialog.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={props.onHandIn}>
              Download my work
            </button>
            <button type="button" className="btn" onClick={() => go(-1)}>
              Back
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (window.confirm("Start again? Your answers and readings for this simulation will be deleted.")) props.onRestart();
              }}
            >
              Start again
            </button>
          </div>
        </div>
      ) : (
        <>
          {step.kind === "predict" && <Predict key={step.id} step={step} {...props} setAnswer={setAnswer} next={() => go(1)} />}
          {step.kind === "task" && <Task key={step.id} step={step} rows={progress.rows} labels={props.labels} next={() => go(1)} />}
          {step.kind === "analyse" && (
            <Analyse key={step.id} step={step} {...props} setAnswer={setAnswer} next={() => go(1)} />
          )}
          {step.kind === "explain" && <Explain key={step.id} step={step} {...props} setAnswer={setAnswer} next={() => go(1)} />}
          {index > 0 && (
            <button type="button" className="text-sm text-muted underline-offset-2 hover:underline" onClick={() => go(-1)}>
              ← Previous step
            </button>
          )}
        </>
      )}

      <label className="flex items-center gap-2 border-t border-line pt-3 text-sm text-muted">
        <input type="checkbox" checked={false} onChange={() => update((p) => ({ ...p, freePlay: true }))} />
        Free play: skip the activity and unlock everything
      </label>
    </div>
  );
}

type StepProps<S> = Props & { step: S; setAnswer: (key: string, value: number) => void; next: () => void };

function Predict({ step, progress, hasTested, setAnswer, next }: StepProps<PredictStep>) {
  const answered = progress.answers[step.id];
  const revealed = progress.answers[revealKey(step.id)] === 1;
  const [choice, setChoice] = useState<number | null>(null);
  const [error, setError] = useState(false);

  if (answered === undefined) {
    return (
      <div className="space-y-3">
        <MathText text={step.question} className="block text-sm font-medium" />
        <Choices
          name={step.id}
          options={step.options}
          value={choice}
          onChange={(i) => {
            setChoice(i);
            setError(false);
          }}
        />
        {error && <p className="text-sm text-bad">Choose an answer first.</p>}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => (choice === null ? setError(true) : setAnswer(step.id, choice))}
        >
          Lock in prediction
        </button>
      </div>
    );
  }

  const correct = gradeChoice(step, answered);
  return (
    <div className="space-y-3 text-sm">
      <MathText text={step.question} className="block font-medium" />
      <p>
        Your prediction: <strong><MathText text={step.options[answered]} /></strong>
      </p>
      {!revealed ? (
        <>
          <p className="text-muted">Now test it: press Play and watch what happens.</p>
          <button type="button" className="btn" disabled={!hasTested} onClick={() => setAnswer(revealKey(step.id), 1)}>
            {hasTested ? "Show the answer" : "Play the simulation first"}
          </button>
        </>
      ) : (
        <>
          <Feedback ok={correct}>
            {correct ? "Your prediction was right. " : `The answer is: ${step.options[step.correctIndex]}. `}
            <MathText text={step.reveal} />
          </Feedback>
          <button type="button" className="btn btn-primary" onClick={next}>
            Next step
          </button>
        </>
      )}
    </div>
  );
}

function Task({ step, rows, labels, next }: { step: TaskStep; rows: Row[]; labels: Labels; next: () => void }) {
  const result = evaluateTask(step.check, rows, labels);
  return (
    <div className="space-y-3 text-sm">
      <MathText text={step.instruction} className="block" />
      <Feedback ok={result.ok}>{result.message}</Feedback>
      <button type="button" className="btn btn-primary" disabled={!result.ok} onClick={next}>
        Next step
      </button>
    </div>
  );
}

function Analyse({ step, progress, labels, axes, setAnswer, next }: StepProps<AnalyseStep>) {
  const passed = progress.answers[step.id] === 1;
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const check = () => {
    const res = evaluateAnalyse(step, progress.rows, axes, labels);
    setMessage({ ok: res.ok, text: res.message });
    if (res.ok) setAnswer(step.id, 1);
  };

  return (
    <div className="space-y-3 text-sm">
      <MathText text={step.instruction} className="block" />
      <p className="text-muted">
        Use the axis menus under the graph. Current graph: {labels[axes.y] ?? axes.y} against {labels[axes.x] ?? axes.x}.
      </p>
      <button type="button" className="btn" onClick={check}>
        Check my graph
      </button>
      {message && (
        <Feedback ok={message.ok}>
          <MathText text={message.text} />
        </Feedback>
      )}
      {passed && !message && <Feedback ok>You found the straight-line graph.</Feedback>}
      <button type="button" className="btn btn-primary" disabled={!passed} onClick={next}>
        Next step
      </button>
    </div>
  );
}

function Explain({ step, progress, update, setAnswer, next }: StepProps<ExplainStep>) {
  const answered = progress.answers[step.id];
  const [choice, setChoice] = useState<number | null>(answered ?? null);
  const correct = answered !== undefined && gradeChoice(step, answered);
  const longEnough = progress.explanation.trim().length >= MIN_EXPLANATION;

  return (
    <div className="space-y-3 text-sm">
      <MathText text={step.question} className="block font-medium" />
      <Choices name={step.id} options={step.options} value={choice} onChange={setChoice} disabled={correct} />
      {!correct && (
        <button type="button" className="btn" disabled={choice === null} onClick={() => choice !== null && setAnswer(step.id, choice)}>
          Check answer
        </button>
      )}
      {answered !== undefined && (
        <Feedback ok={correct}>{correct ? step.feedbackCorrect : step.feedbackWrong}</Feedback>
      )}
      <label className="block space-y-1.5">
        <MathText text={step.prompt} className="block font-medium" />
        <textarea
          className="min-h-28 w-full rounded-lg border border-line bg-surface p-2"
          value={progress.explanation}
          onChange={(e) => update((p) => ({ ...p, explanation: e.target.value }))}
          placeholder="Write your explanation here"
        />
      </label>
      {!longEnough && <p className="text-xs text-muted">Write at least a sentence to finish.</p>}
      <button type="button" className="btn btn-primary" disabled={!correct || !longEnough} onClick={next}>
        Finish activity
      </button>
    </div>
  );
}
