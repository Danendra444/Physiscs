"use client";

import { useEffect, useRef } from "react";
import { fitCanvas, readPalette } from "@/lib/simkit/canvas";
import type { AnySim, Palette } from "@/lib/simkit/types";
import type { SimEngineHandle } from "./useSimEngine";

interface Props {
  sim: AnySim;
  handle: SimEngineHandle;
  toggles: Record<string, boolean>;
}

/** Draws the simulation every animation frame. */
export function SimCanvas({ sim, handle, toggles }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const togglesRef = useRef(toggles);
  const palette = useRef<Palette | null>(null);
  const { addFrameListener } = handle;

  useEffect(() => {
    togglesRef.current = toggles;
  }, [toggles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    palette.current = readPalette(canvas);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      palette.current = readPalette(canvas);
    };
    media.addEventListener("change", onScheme);

    const remove = addFrameListener((engine) => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !palette.current) return;
      const { width, height } = fitCanvas(canvas);
      sim.render(ctx, engine.state, engine.params, {
        width,
        height,
        toggles: togglesRef.current,
        colors: palette.current,
      });
    });
    return () => {
      remove();
      media.removeEventListener("change", onScheme);
    };
  }, [addFrameListener, sim]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={sim.canvasLabel}
      className="block aspect-[4/3] w-full rounded-lg border border-line sm:aspect-[16/10]"
    />
  );
}
