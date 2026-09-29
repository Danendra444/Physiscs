import type { Palette } from "./types";

/** Size the canvas backing store for the screen's pixel density. Returns the size in CSS pixels. */
export function fitCanvas(canvas: HTMLCanvasElement): { width: number; height: number } {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

/** Read the simulation colours from CSS variables so canvases follow light/dark mode. */
export function readPalette(el: Element): Palette {
  const css = getComputedStyle(el);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    bg: v("--sim-bg", "#ffffff"),
    fg: v("--sim-fg", "#1f2937"),
    muted: v("--sim-muted", "#9ca3af"),
    grid: v("--sim-grid", "#e5e7eb"),
    accent: v("--sim-accent", "#2563eb"),
    accent2: v("--sim-accent2", "#ea580c"),
    accent3: v("--sim-accent3", "#16a34a"),
    danger: v("--sim-danger", "#dc2626"),
  };
}

export function clear(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  options: { width?: number; dashed?: boolean; head?: number } = {},
) {
  const { width = 2.5, dashed = false, head = 9 } = options;
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(angle) * head * 0.8, y2 - Math.sin(angle) * head * 0.8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 7), y2 - head * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 7), y2 - head * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  options: { align?: CanvasTextAlign; size?: number; baseline?: CanvasTextBaseline } = {},
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${options.size ?? 13}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = options.align ?? "left";
  ctx.textBaseline = options.baseline ?? "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}
