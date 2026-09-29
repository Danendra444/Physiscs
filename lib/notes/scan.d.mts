export interface ScanResult {
  headings: { id: string; text: string }[];
  checks: { id: string; kind: "choice" | "number" }[];
  checklist: { id: string; text: string }[];
  trySims: string[];
  problems: string[];
}

export interface NotesIndexFile {
  [topicId: string]: Pick<ScanResult, "headings" | "checks" | "checklist">;
}

export function scanSource(source: string, label: string): ScanResult;

export function scanDir(dir: string): {
  index: NotesIndexFile;
  trySims: Record<string, string[]>;
  problems: string[];
};

export function serializeIndex(index: NotesIndexFile): string;
