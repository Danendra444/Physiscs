"use client";

import { useMemo, useState } from "react";
import { columnsFor, makeRow, recordBlockReason } from "@/lib/simkit/recorder";
import type { Params } from "@/lib/simkit/types";
import { getSim, getTopic } from "@/sims/registry";
import { ActivityPanel, revealKey } from "./ActivityPanel";
import { Controls } from "./Controls";
import { DataGraph } from "./DataGraph";
import { DataTable } from "./DataTable";
import { HandIn } from "./HandIn";
import { LiveGraph } from "./LiveGraph";
import { ReadoutsPanel } from "./ReadoutsPanel";
import { SimCanvas } from "./SimCanvas";
import { TheoryPanel } from "./TheoryPanel";
import { useProgress } from "./useProgress";
import { useSimEngine } from "./useSimEngine";

/**
 * A full simulation page. Takes a slug (not the simulation object) because
 * simulation definitions contain functions, which can't be passed from a server page.
 */
export function SimPage({ slug }: { slug: string }) {
  const sim = getSim(slug)!;
  const [params, setParams] = useState<Params>(() => Object.fromEntries(sim.params.map((p) => [p.id, p.default])));
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((sim.toggles ?? []).map((t) => [t.id, t.default])),
  );
  const [playedSincePrediction, setPlayedSincePrediction] = useState(false);
  const handle = useSimEngine(sim, params);
  const { progress, update, restart, storeAvailable } = useProgress(slug);

  const columns = useMemo(() => columnsFor(sim, handle.readouts), [sim, handle.readouts]);
  const labels = useMemo(() => Object.fromEntries(columns.map((c) => [c.id, c.label])), [columns]);
  const axes = progress.axes ?? { x: columns[0].id, y: columns[sim.params.length].id };

  const steps = sim.content.activity.steps;
  const firstPredict = steps.find((s) => s.kind === "predict");
  const predictionMade = !firstPredict || progress.answers[firstPredict.id] !== undefined;
  const playLocked = !progress.freePlay && !predictionMade;
  const hasTested =
    playedSincePrediction || (firstPredict !== undefined && progress.answers[revealKey(firstPredict.id)] === 1);

  const recordBlock = playLocked ? "Make your prediction first." : handle.recordBlock;

  const record = () => {
    const now = handle.current();
    if (!now || playLocked) return;
    const readouts = sim.readouts(now.state, now.params);
    if (recordBlockReason(sim, now.state, now.params, readouts)) {
      handle.refresh();
      return;
    }
    const row = makeRow(sim, now.params, readouts);
    update((p) => ({ ...p, rows: [...p.rows, row] }));
  };

  return (
    <>
      <div className="screen-only space-y-5">
        {!storeAvailable && (
          <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn" role="status">
            Your browser is blocking storage, so your progress won&apos;t be saved when you close this page.
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section className="card space-y-4 p-4" aria-label="Simulation">
            <SimCanvas sim={sim} handle={handle} toggles={toggles} />
            {handle.event && (
              <div role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
                {handle.event.message}
              </div>
            )}
            <Controls
              sim={sim}
              params={params}
              onParam={(id, value) => setParams((p) => ({ ...p, [id]: value }))}
              toggles={toggles}
              onToggle={(id, value) => setToggles((t) => ({ ...t, [id]: value }))}
              running={handle.running}
              playLocked={playLocked}
              onPlay={() => {
                handle.play();
                if (predictionMade) setPlayedSincePrediction(true);
              }}
              onPause={handle.pause}
              onReset={handle.reset}
              onAction={handle.action}
              onRecord={record}
              recordBlock={recordBlock}
            />
            <ReadoutsPanel readouts={handle.readouts} />
          </section>

          <section className="card p-4" aria-label="Guided activity">
            <ActivityPanel
              title={sim.content.activity.title}
              steps={steps}
              progress={progress}
              update={update}
              labels={labels}
              axes={axes}
              hasTested={hasTested}
              onHandIn={() => window.print()}
              onRestart={() => {
                restart();
                setPlayedSincePrediction(false);
              }}
            />
            {progress.stepIndex >= steps.length && !progress.freePlay && (
              <label className="mt-4 block text-sm">
                <span className="text-muted">Your name (for the hand-in page)</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-2 py-1.5"
                  value={progress.studentName}
                  onChange={(e) => update((p) => ({ ...p, studentName: e.target.value }))}
                  autoComplete="name"
                />
              </label>
            )}
          </section>
        </div>

        {sim.liveSeries && sim.liveSeries.length > 0 && (
          <section className="card p-4" aria-label="Live graph">
            <LiveGraph specs={sim.liveSeries} handle={handle} />
          </section>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="card p-4" aria-labelledby="data-heading">
            <h2 id="data-heading" className="mb-3 font-semibold">
              Data table
            </h2>
            <DataTable
              columns={columns}
              rows={progress.rows}
              fileName={sim.slug}
              onDelete={(i) => update((p) => ({ ...p, rows: p.rows.filter((_, j) => j !== i) }))}
              onClear={() => update((p) => ({ ...p, rows: [] }))}
            />
          </section>
          <section className="card p-4" aria-labelledby="graph-heading">
            <h2 id="graph-heading" className="mb-3 font-semibold">
              Graph
            </h2>
            <DataGraph columns={columns} rows={progress.rows} axes={axes} onAxes={(a) => update((p) => ({ ...p, axes: a }))} />
          </section>
        </div>

        <TheoryPanel
          theory={sim.content.theory}
          notesHref={getTopic(sim.topic)?.hasNotes ? `/topics/${sim.topic}/notes/` : undefined}
        />
      </div>

      <HandIn sim={sim} progress={progress} columns={columns} labels={labels} axes={axes} />
    </>
  );
}
