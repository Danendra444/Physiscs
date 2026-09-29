"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Engine } from "@/lib/simkit/loop";
import { recordBlockReason } from "@/lib/simkit/recorder";
import type { AnySim, Params, Readouts, SimEvent } from "@/lib/simkit/types";

export type FrameListener = (engine: Engine<unknown>) => void;

/** How often readouts are pushed to React while running (ms). */
const READOUT_INTERVAL = 100;

/** What React renders from: a copy of the engine's state, taken at most ~10 times a second. */
export interface EngineSnapshot {
  readouts: Readouts;
  running: boolean;
  event: SimEvent | null;
  /** Why a reading can't be recorded right now, or null. */
  recordBlock: string | null;
}

function snapshot(sim: AnySim, state: unknown, params: Params, running: boolean, event: SimEvent | null): EngineSnapshot {
  const readouts = sim.readouts(state, params);
  return { readouts, running, event, recordBlock: recordBlockReason(sim, state, params, readouts) };
}

const defaults = (sim: AnySim): Params => Object.fromEntries(sim.params.map((p) => [p.id, p.default]));

/**
 * Owns the simulation engine and drives it with requestAnimationFrame.
 * The engine lives in a ref, outside React state, so animation never waits for re-renders;
 * components that draw (canvas, live graph) subscribe with addFrameListener.
 */
export function useSimEngine(sim: AnySim, params: Params) {
  const engineRef = useRef<Engine<unknown> | null>(null);
  const listeners = useRef(new Set<FrameListener>());
  const dirty = useRef(true);
  const [snap, setSnap] = useState<EngineSnapshot>(() =>
    snapshot(sim, sim.initialState(params), params, false, null),
  );

  // Create the engine and run the animation loop.
  useEffect(() => {
    const engine = new Engine<unknown>(sim, defaults(sim));
    engineRef.current = engine;
    engine.onEvent = () => {
      dirty.current = true;
    };
    let raf = 0;
    let last = performance.now();
    let lastPublish = 0;
    const frame = (now: number) => {
      engine.advance((now - last) / 1000);
      last = now;
      for (const listener of listeners.current) listener(engine);
      if ((engine.running && now - lastPublish > READOUT_INTERVAL) || dirty.current) {
        dirty.current = false;
        lastPublish = now;
        setSnap(snapshot(sim, engine.state, engine.params, engine.running, engine.event));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      engineRef.current = null;
    };
  }, [sim]);

  // Parameters changed: restart from the new initial conditions (keeps playing if it was).
  useEffect(() => {
    engineRef.current?.setParams(params);
    dirty.current = true;
  }, [params]);

  const command = useCallback((fn: (engine: Engine<unknown>) => void) => {
    if (engineRef.current) fn(engineRef.current);
    dirty.current = true;
  }, []);

  const addFrameListener = useCallback((listener: FrameListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  /** The engine's exact current state, for event handlers such as "Record reading". */
  const current = useCallback(() => {
    const e = engineRef.current;
    return e ? { state: e.state, params: e.params } : null;
  }, []);

  return {
    ...snap,
    play: () => command((e) => e.play()),
    pause: () => command((e) => e.pause()),
    reset: () => command((e) => e.reset()),
    action: (id: string) => command((e) => e.action(id)),
    addFrameListener,
    current,
  };
}

export type SimEngineHandle = ReturnType<typeof useSimEngine>;
