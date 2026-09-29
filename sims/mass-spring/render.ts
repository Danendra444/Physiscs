import { clear, drawArrow, label } from "@/lib/simkit/canvas";
import type { Params, ViewInfo } from "@/lib/simkit/types";
import { accelerationOf, type SpringState } from "./physics";

const MAX_AMPLITUDE = 0.2; // m, the largest amplitude the slider allows

export function render(ctx: CanvasRenderingContext2D, s: SpringState, p: Params, view: ViewInfo) {
  const { width, height, colors } = view;
  clear(ctx, width, height, colors.bg);

  const cx = width / 2;
  const floorY = height * 0.68;
  const scale = (width * 0.34) / MAX_AMPLITUDE; // pixels per metre
  const blockSize = Math.min(70, Math.max(38, 40 + 18 * Math.sqrt(p.m)));
  const wallX = Math.max(16, cx - MAX_AMPLITUDE * scale - blockSize - 40);
  const massX = cx + s.x * scale;

  // Floor and wall
  ctx.fillStyle = colors.grid;
  ctx.fillRect(0, floorY, width, 4);
  ctx.fillRect(wallX - 12, floorY - blockSize - 40, 12, blockSize + 44);

  // Equilibrium line and amplitude markers
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 1;
  for (const [x, text] of [
    [cx, "x = 0"],
    [cx + p.A * scale, "+A"],
    [cx - p.A * scale, "−A"],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x, floorY - blockSize - 28);
    ctx.lineTo(x, floorY + 14);
    ctx.stroke();
    label(ctx, text, x, floorY + 26, colors.muted, { align: "center", size: 12 });
  }
  ctx.restore();

  // Spring: a zigzag from the wall to the left face of the block
  const springY = floorY - blockSize / 2;
  const x0 = wallX;
  const x1 = massX - blockSize / 2;
  const coils = 14;
  ctx.strokeStyle = colors.fg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, springY);
  const lead = 10;
  ctx.lineTo(x0 + lead, springY);
  for (let i = 0; i < coils; i++) {
    const xa = x0 + lead + ((x1 - x0 - 2 * lead) * (i + 0.5)) / coils;
    ctx.lineTo(xa, springY + (i % 2 === 0 ? -12 : 12));
  }
  ctx.lineTo(x1 - lead, springY);
  ctx.lineTo(x1, springY);
  ctx.stroke();

  // Mass block
  ctx.fillStyle = colors.accent;
  ctx.fillRect(massX - blockSize / 2, floorY - blockSize, blockSize, blockSize);
  label(ctx, "m", massX, floorY - blockSize / 2, colors.bg, { align: "center", size: 15 });

  // Vectors
  const arrowY = floorY - blockSize - 16;
  if (view.toggles.velocity && Math.abs(s.v) > 1e-3) {
    const vScale = (width * 0.12) / Math.max(0.05, p.A * Math.sqrt(p.k / p.m));
    drawArrow(ctx, massX, arrowY, massX + s.v * vScale, arrowY, colors.accent3);
    label(ctx, "v", massX + s.v * vScale + (s.v >= 0 ? 8 : -16), arrowY, colors.accent3);
  }
  if (view.toggles.acceleration && Math.abs(accelerationOf(s, p)) > 1e-3) {
    const aMax = Math.max(0.05, (p.k * p.A) / p.m);
    const aScale = (width * 0.12) / aMax;
    const a = accelerationOf(s, p);
    const y = arrowY - 22;
    drawArrow(ctx, massX, y, massX + a * aScale, y, colors.accent2, { dashed: true });
    label(ctx, "a", massX + a * aScale + (a >= 0 ? 8 : -16), y, colors.accent2);
  }

  label(ctx, `t = ${s.t.toFixed(2)} s`, 12, 16, colors.muted, { size: 12 });
}
