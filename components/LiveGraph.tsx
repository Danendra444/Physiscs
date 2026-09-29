"use client";

import { useEffect, useRef, useState } from "react";
import type uPlot from "uplot";
import { readPalette } from "@/lib/simkit/canvas";
import type { LiveSeriesSpec, Params } from "@/lib/simkit/types";
import type { SimEngineHandle } from "./useSimEngine";

const WINDOW_SECONDS = 10; // simulated seconds shown
const REDRAW_MS = 66;

interface Props {
  specs: LiveSeriesSpec<unknown>[];
  handle: SimEngineHandle;
}

/** A scrolling time graph of one live quantity (e.g. x–t), sampled every frame while the simulation runs. */
export function LiveGraph({ specs, handle }: Props) {
  const [active, setActive] = useState(specs[0].id);
  const spec = specs.find((s) => s.id === active) ?? specs[0];
  const box = useRef<HTMLDivElement>(null);
  const { addFrameListener } = handle;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let plot: uPlot | null = null;
    let cancelled = false;
    let removeListener = () => {};
    let observer: ResizeObserver | null = null;

    const t: number[] = [];
    const ys: number[][] = spec.series.map(() => []);
    let lastT = -Infinity;
    let lastDraw = 0;

    import("uplot").then(({ default: UPlot }) => {
      if (cancelled) return;
      const colors = readPalette(el);
      plot = new UPlot(
        {
          width: el.clientWidth,
          height: 180,
          legend: { show: spec.series.length > 1 },
          cursor: { show: false },
          scales: { x: { time: false } },
          axes: [
            { stroke: colors.muted, grid: { stroke: colors.grid }, label: "t / s" },
            { stroke: colors.muted, grid: { stroke: colors.grid }, label: spec.yLabel, size: 60 },
          ],
          series: [{}, ...spec.series.map((s) => ({ label: s.label, stroke: colors[s.color], width: 2 }))],
        },
        [t, ...ys],
        el,
      );
      observer = new ResizeObserver(() => plot?.setSize({ width: el.clientWidth, height: 180 }));
      observer.observe(el);

      removeListener = addFrameListener((engine) => {
        const sample = spec.sample(engine.state, engine.params as Params);
        if (sample.t < lastT) {
          // The simulation was reset: start a fresh trace.
          t.length = 0;
          ys.forEach((y) => (y.length = 0));
        }
        if (sample.t !== lastT) {
          t.push(sample.t);
          spec.series.forEach((s, i) => ys[i].push(sample.values[s.id]));
          lastT = sample.t;
          while (t.length > 0 && t[0] < sample.t - WINDOW_SECONDS) {
            t.shift();
            ys.forEach((y) => y.shift());
          }
        }
        const now = performance.now();
        if (now - lastDraw > REDRAW_MS) {
          lastDraw = now;
          plot?.setData([t.slice(), ...ys.map((y) => y.slice())]);
        }
      });
    });

    return () => {
      cancelled = true;
      removeListener();
      observer?.disconnect();
      plot?.destroy();
    };
  }, [spec, addFrameListener]);

  return (
    <div>
      <div role="tablist" aria-label="Live graph" className="mb-2 flex flex-wrap gap-1">
        {specs.map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={s.id === active}
            onClick={() => setActive(s.id)}
            className={`rounded-md px-2.5 py-1 text-sm ${s.id === active ? "bg-accent-soft text-accent font-medium" : "text-muted hover:text-ink"}`}
          >
            {s.title}
          </button>
        ))}
      </div>
      <div ref={box} className="w-full" />
    </div>
  );
}
