// TEMPLATE: draw one frame. Use view.colors so it works in light and dark mode.
import { clear, label } from "@/lib/simkit/canvas";
import type { Params, ViewInfo } from "@/lib/simkit/types";
import type { TemplateState } from "./physics";

export function render(ctx: CanvasRenderingContext2D, s: TemplateState, p: Params, view: ViewInfo) {
  const { width, height, colors } = view;
  clear(ctx, width, height, colors.bg);
  const scale = width / 20; // pixels per metre
  const x = 20 + ((s.x * scale) % (width - 40));
  ctx.fillStyle = colors.accent;
  ctx.fillRect(x, height / 2 - 15, 40, 30);
  label(ctx, `t = ${s.t.toFixed(2)} s`, 12, 16, colors.muted, { size: 12 });
}
