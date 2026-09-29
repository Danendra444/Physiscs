import type { MDXComponents } from "mdx/types";
import { Checklist } from "@/components/notes/Checklist";
import { CommonMistake, Definition, ExamTip, KeyEquation } from "@/components/notes/Callouts";
import { SelfCheck } from "@/components/notes/SelfCheck";
import { TrySim } from "@/components/notes/TrySim";
import { WorkedExample } from "@/components/notes/WorkedExample";

// Everything a notes file can use without importing it.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Definition,
    KeyEquation,
    WorkedExample,
    CommonMistake,
    ExamTip,
    SelfCheck,
    TrySim,
    Checklist,
    ...components,
  };
}
