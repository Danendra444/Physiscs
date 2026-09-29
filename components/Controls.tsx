"use client";

import { formatNumber } from "@/lib/simkit/format";
import type { AnySim, Params } from "@/lib/simkit/types";

interface Props {
  sim: AnySim;
  params: Params;
  onParam: (id: string, value: number) => void;
  toggles: Record<string, boolean>;
  onToggle: (id: string, value: boolean) => void;
  running: boolean;
  playLocked: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onAction: (id: string) => void;
  onRecord: () => void;
  recordBlock: string | null;
}

export function Controls(props: Props) {
  const { sim, params, toggles, running, playLocked, recordBlock } = props;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {running ? (
          <button type="button" className="btn btn-primary" onClick={props.onPause}>
            Pause
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={props.onPlay}
            disabled={playLocked}
            title={playLocked ? "Make your prediction first" : undefined}
          >
            Play
          </button>
        )}
        <button type="button" className="btn" onClick={props.onReset}>
          Reset
        </button>
        {sim.actions?.map((a) => (
          <button key={a.id} type="button" className="btn" onClick={() => props.onAction(a.id)} disabled={!running}>
            {a.label}
          </button>
        ))}
        <button
          type="button"
          className="btn sm:ml-auto"
          onClick={props.onRecord}
          disabled={recordBlock !== null}
          data-testid="record"
        >
          Record reading
        </button>
      </div>
      {playLocked && (
        <p className="text-sm text-warn">Make your prediction in the activity panel to unlock Play.</p>
      )}
      {recordBlock && !playLocked && <p className="text-sm text-muted">{recordBlock}</p>}

      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {sim.params.map((p) => {
          const id = `param-${p.id}`;
          return (
            <div key={p.id}>
              <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-muted">
                  {p.label} <em className="font-serif not-italic text-ink">{p.symbol}</em>
                </span>
                <span className="font-mono text-ink tabular-nums">
                  {formatNumber(params[p.id], p.sf)} {p.unit}
                </span>
              </label>
              <input
                id={id}
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={params[p.id]}
                onChange={(e) => props.onParam(p.id, Number(e.target.value))}
                aria-valuetext={`${formatNumber(params[p.id], p.sf)} ${p.unit}`}
              />
            </div>
          );
        })}
      </div>

      {sim.toggles && sim.toggles.length > 0 && (
        <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <legend className="sr-only">Show on the diagram</legend>
          {sim.toggles.map((t) => (
            <label key={t.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={toggles[t.id] ?? t.default}
                onChange={(e) => props.onToggle(t.id, e.target.checked)}
              />
              {t.label}
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
