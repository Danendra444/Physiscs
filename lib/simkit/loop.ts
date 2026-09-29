import type { Params, SimDefinition, SimEvent } from "./types";

/** Longest real-time frame we simulate; longer gaps (tab switches, slow devices) are dropped. */
const MAX_FRAME_SECONDS = 0.1;
/** Safety cap on physics steps per frame. */
const MAX_STEPS_PER_FRAME = 20000;

/**
 * Runs a simulation with a fixed physics time step, independent of frame rate.
 * It knows nothing about React or the DOM: the UI calls advance() once per animation frame.
 */
export class Engine<S> {
  state: S;
  params: Params;
  running = false;
  event: SimEvent | null = null;
  onEvent: ((event: SimEvent) => void) | null = null;

  private accumulator = 0;

  constructor(
    private readonly sim: SimDefinition<S>,
    params: Params,
  ) {
    this.params = { ...params };
    this.state = sim.initialState(this.params);
  }

  play() {
    if (this.event) return;
    this.running = true;
  }

  pause() {
    this.running = false;
  }

  reset() {
    this.state = this.sim.initialState(this.params);
    this.accumulator = 0;
    this.event = null;
  }

  setParams(params: Params, reset = true) {
    this.params = { ...params };
    if (reset) this.reset();
  }

  action(id: string) {
    if (!this.sim.applyAction) return;
    this.state = this.sim.applyAction(id, this.state, this.params);
  }

  /** Advance by `realSeconds` of wall-clock time. */
  advance(realSeconds: number) {
    if (!this.running) return;
    const dt = this.sim.dt;
    this.accumulator += Math.min(realSeconds, MAX_FRAME_SECONDS) * this.sim.timeScale(this.params);

    let steps = 0;
    while (this.accumulator >= dt && steps < MAX_STEPS_PER_FRAME) {
      const next = this.sim.step(this.state, this.params, dt);
      if (!this.isFinite(next)) {
        this.stop({
          kind: "numerical",
          message: "The simulation became unstable, so it was reset. Try less extreme slider values.",
        });
        this.state = this.sim.initialState(this.params);
        return;
      }
      this.state = next;
      this.accumulator -= dt;
      steps++;

      const event = this.sim.events?.(this.state, this.params) ?? null;
      if (event) {
        this.stop(event);
        return;
      }
    }
    if (steps >= MAX_STEPS_PER_FRAME) this.accumulator = 0;
  }

  private stop(event: SimEvent) {
    this.running = false;
    this.event = event;
    this.accumulator = 0;
    this.onEvent?.(event);
  }

  /** Every numeric field of the state must be finite (null fields, e.g. "not measured yet", are fine). */
  private isFinite(state: S): boolean {
    if (typeof state !== "object" || state === null) return true;
    return Object.values(state).every((v) => typeof v !== "number" || Number.isFinite(v));
  }
}
