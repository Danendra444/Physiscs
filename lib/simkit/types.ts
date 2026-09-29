// The contract every simulation implements. The shared UI in components/
// only ever talks to a simulation through this interface, so adding a new
// simulation never requires changing pages or components.

export type Params = Record<string, number>;

/** One recorded reading: parameter values, readouts and derived columns, keyed by id. */
export type Row = Record<string, number>;

export interface ParamSpec {
  id: string;
  label: string;
  /** Symbol shown next to the slider, e.g. "m" or "r". */
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Significant figures used when this parameter is recorded in the data table. */
  sf: number;
}

export interface Quantity {
  label: string;
  symbol: string;
  value: number;
  unit: string;
  /** Significant figures to display and record. */
  sf: number;
}

export type Readouts = Record<string, Quantity>;

export interface DerivedColumn {
  id: string;
  /** Column heading, e.g. "T²". */
  label: string;
  unit: string;
  compute: (row: Row) => number;
}

export interface Column {
  id: string;
  label: string;
  unit: string;
  /** Significant figures for display. */
  sf: number;
  source: "param" | "readout" | "derived";
}

export interface SimEvent {
  kind: string;
  message: string;
}

export interface Toggle {
  id: string;
  label: string;
  default: boolean;
}

export interface SimAction {
  id: string;
  label: string;
}

export interface Palette {
  bg: string;
  fg: string;
  muted: string;
  grid: string;
  accent: string;
  accent2: string;
  accent3: string;
  danger: string;
}

export interface ViewInfo {
  /** Canvas size in CSS pixels. */
  width: number;
  height: number;
  toggles: Record<string, boolean>;
  colors: Palette;
}

/** Values sampled every frame for a live time graph (e.g. x–t for an oscillator). */
export interface LiveSeriesSpec<S> {
  id: string;
  title: string;
  yLabel: string;
  series: { id: string; label: string; color: keyof Palette }[];
  sample: (state: S, params: Params) => { t: number; values: Record<string, number> };
}

export interface TheoryContent {
  summary: string;
  equations: { tex: string; caption: string }[];
  sections: { heading: string; body: string }[];
  /** 9702 syllabus learning outcomes covered. */
  outcomes: { code: string; text: string }[];
}

export interface PredictStep {
  kind: "predict";
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  /** Shown after the student has tested their prediction. */
  reveal: string;
}

export interface TaskStep {
  kind: "task";
  id: string;
  instruction: string;
  check: TaskCheck;
}

export interface TaskCheck {
  minRows: number;
  /** Column whose values must differ across rows. */
  varyColumn?: string;
  /** Columns that must stay the same across rows (a fair test). */
  holdConstant?: string[];
}

export interface AnalyseStep {
  kind: "analyse";
  id: string;
  instruction: string;
  /** Axes that give the expected straight line. */
  target: { x: string; y: string };
  /** Theoretical gradient, computed from the recorded rows (e.g. from the constant m and r). */
  expectedGradient: (rows: Row[]) => number;
  gradientUnit: string;
  tolerancePct: number;
  hint: string;
}

export interface ExplainStep {
  kind: "explain";
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  feedbackCorrect: string;
  feedbackWrong: string;
  /** Prompt for the free-text explanation. */
  prompt: string;
}

export type ActivityStep = PredictStep | TaskStep | AnalyseStep | ExplainStep;

export interface ActivityDefinition {
  title: string;
  steps: ActivityStep[];
}

export interface SimDefinition<S = unknown> {
  slug: string;
  title: string;
  /** Topic id from sims/registry.ts. */
  topic: string;
  summary: string;
  syllabusRefs: string[];
  params: ParamSpec[];
  toggles?: Toggle[];
  actions?: SimAction[];
  /** Physics time step in simulated seconds. */
  dt: number;
  /** Simulated seconds per real second (e.g. 600 for orbits that take hours). */
  timeScale: (params: Params) => number;
  initialState: (params: Params) => S;
  step: (state: S, params: Params, dt: number) => S;
  readouts: (state: S, params: Params) => Readouts;
  /** Readout ids that are copied into the data table when a reading is recorded. */
  recordable: string[];
  derivedColumns: DerivedColumn[];
  events?: (state: S, params: Params) => SimEvent | null;
  /** Reason a reading can't be recorded right now (e.g. "the string is cut"), or null if it can. */
  recordBlocker?: (state: S, params: Params) => string | null;
  applyAction?: (actionId: string, state: S, params: Params) => S;
  render: (ctx: CanvasRenderingContext2D, state: S, params: Params, view: ViewInfo) => void;
  /** Text description of the canvas for screen readers. */
  canvasLabel: string;
  /** Live time graphs shown under the canvas (the student picks one at a time). */
  liveSeries?: LiveSeriesSpec<S>[];
  content: { theory: TheoryContent; activity: ActivityDefinition };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySim = SimDefinition<any>;

export interface Topic {
  id: string;
  /** Syllabus topic number in 9702 (1–25). */
  number: number;
  title: string;
  /** Topics 1–11 are AS Level; 12–25 are the extra A Level topics. */
  level: "AS" | "A2";
  summary: string;
  /** True when content/notes/<id>.mdx exists. Checked by tests/unit/notes-content.test.ts. */
  hasNotes: boolean;
}
