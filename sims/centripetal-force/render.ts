import { clear, drawArrow, label } from "@/lib/simkit/canvas";
import type { Params, ViewInfo } from "@/lib/simkit/types";
import type { WhirlState } from "./physics";

const MAX_RADIUS = 1.0; // m, the largest radius the slider allows
const MAX_SPEED = 8; // m/s

export function render(ctx: CanvasRenderingContext2D, s: WhirlState, p: Params, view: ViewInfo) {
  const { width, height, colors } = view;
  clear(ctx, width, height, colors.bg);

  const cx = width / 2;
  const cy = height / 2;
  // Fixed scale (not per radius) so students can see the circle get bigger or smaller.
  const scale = (Math.min(width, height) / 2 - 24) / (MAX_RADIUS * 1.15);
  const bx = cx + s.x * scale;
  const by = cy - s.y * scale;

  // Circular path
  ctx.save();
  ctx.strokeStyle = colors.grid;
  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, p.r * scale, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();

  // Hand / tube at the centre, and the string while attached
  if (!s.released) {
    ctx.strokeStyle = colors.fg;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.fillStyle = colors.muted;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
  ctx.fill();

  // Vectors (length proportional to magnitude, relative to the slider maximum)
  const unit = Math.min(width, height) * 0.22;
  if (view.toggles.velocity) {
    const len = unit * (p.v / MAX_SPEED);
    const v = Math.hypot(s.vx, s.vy);
    drawArrow(ctx, bx, by, bx + (s.vx / v) * len, by - (s.vy / v) * len, colors.accent3);
    label(ctx, "v", bx + (s.vx / v) * (len + 12), by - (s.vy / v) * (len + 12), colors.accent3, { align: "center" });
  }
  if (view.toggles.acceleration && !s.released) {
    const aMax = MAX_SPEED ** 2 / 0.2;
    const len = Math.max(14, unit * Math.sqrt((p.v * p.v) / p.r / aMax));
    const r = Math.hypot(s.x, s.y);
    drawArrow(ctx, bx, by, bx - (s.x / r) * len, by + (s.y / r) * len, colors.accent2, { dashed: true });
    label(ctx, "a", bx - (s.x / r) * (len + 12), by + (s.y / r) * (len + 12), colors.accent2, { align: "center" });
  }

  // The bung (bigger for more mass)
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.arc(bx, by, 7 + 10 * Math.sqrt(p.m / 0.5), 0, 2 * Math.PI);
  ctx.fill();

  label(ctx, "View from above", 12, 16, colors.muted, { size: 12 });
  if (s.released) label(ctx, "String cut", 12, 34, colors.danger, { size: 12 });
}
