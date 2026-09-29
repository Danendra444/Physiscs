import { clear, drawArrow, label } from "@/lib/simkit/canvas";
import type { Params, ViewInfo } from "@/lib/simkit/types";
import { PLANET_RADIUS, orbitShape, radius, type OrbitState } from "./physics";

/** How far out the view reaches, fixed per parameter set so the zoom doesn't jump while running. */
function viewExtent(p: Params) {
  const f2 = p.f * p.f;
  const apoapsisFactor = f2 < 2 ? Math.max(1, f2 / (2 - f2)) : 3;
  return p.r * Math.min(3, apoapsisFactor) * 1.12;
}

export function render(ctx: CanvasRenderingContext2D, s: OrbitState, p: Params, view: ViewInfo) {
  const { width, height, colors } = view;
  clear(ctx, width, height, colors.bg);

  const cx = width / 2;
  const cy = height / 2;
  const scale = (Math.min(width, height) / 2) / viewExtent(p); // pixels per metre
  const toScreen = (x: number, y: number) => [cx + x * scale, cy - y * scale] as const;

  // Launch-radius circle for reference
  ctx.save();
  ctx.strokeStyle = colors.grid;
  ctx.setLineDash([3, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, p.r * scale, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();

  // Predicted path: r(θ) = p / (1 + e·cos(θ − ω)), drawn where the conic exists
  const shape = orbitShape(s, p);
  ctx.save();
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let penDown = false;
  const maxR = (Math.max(width, height) / scale) * 1.5;
  for (let i = 0; i <= 720; i++) {
    const theta = (i / 720) * 2 * Math.PI;
    const denom = 1 + shape.e * Math.cos(theta - shape.periapsisAngle);
    const r = denom > 1e-6 ? shape.semiLatus / denom : Infinity;
    if (!Number.isFinite(r) || r > maxR) {
      penDown = false;
      continue;
    }
    const [sx, sy] = toScreen(r * Math.cos(theta), r * Math.sin(theta));
    if (penDown) ctx.lineTo(sx, sy);
    else ctx.moveTo(sx, sy);
    penDown = true;
  }
  ctx.stroke();
  ctx.restore();

  // Planet
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(3, PLANET_RADIUS * scale), 0, 2 * Math.PI);
  ctx.fill();

  // Satellite
  const [sx, sy] = toScreen(s.x, s.y);
  if (view.toggles.radius) {
    ctx.save();
    ctx.strokeStyle = colors.muted;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    ctx.restore();
    label(ctx, "r", (cx + sx) / 2 + 6, (cy + sy) / 2 - 8, colors.muted);
  }

  const arrowLen = Math.min(width, height) * 0.14;
  if (view.toggles.velocity) {
    const v = Math.hypot(s.vx, s.vy);
    const vCirc = Math.sqrt((6.67e-11 * p.M) / p.r);
    const len = arrowLen * (v / vCirc);
    drawArrow(ctx, sx, sy, sx + (s.vx / v) * len, sy - (s.vy / v) * len, colors.accent3);
  }
  if (view.toggles.force) {
    const r = radius(s);
    const len = arrowLen * 0.8 * Math.min(2.5, (p.r / r) ** 2);
    drawArrow(ctx, sx, sy, sx - (s.x / r) * len, sy + (s.y / r) * len, colors.accent2, { dashed: true });
  }

  ctx.fillStyle = colors.fg;
  ctx.beginPath();
  ctx.arc(sx, sy, 6, 0, 2 * Math.PI);
  ctx.fill();

  const hours = s.t / 3600;
  label(ctx, `t = ${hours.toFixed(1)} h`, 12, 16, colors.muted, { size: 12 });
  label(ctx, "1 s on screen ≈ 2.2 h", 12, 34, colors.muted, { size: 12 });
}
