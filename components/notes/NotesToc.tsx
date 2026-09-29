import type { NotesIndexFile } from "@/lib/notes/scan.mjs";

type Headings = NotesIndexFile[string]["headings"];

function List({ headings }: { headings: Headings }) {
  return (
    <ol className="space-y-1.5 text-sm">
      {headings.map((h) => (
        <li key={h.id}>
          <a href={`#${h.id}`} className="text-muted hover:text-accent">
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Contents list built from the notes' ## headings: collapsible on phones, a sticky sidebar on desktop. */
export function NotesToc({ headings }: { headings: Headings }) {
  return (
    <>
      <details className="notes-toc card no-print p-3 lg:hidden">
        <summary className="cursor-pointer font-medium">Contents</summary>
        <div className="mt-2">
          <List headings={headings} />
        </div>
      </details>
      <nav aria-label="On this page" className="notes-toc no-print sticky top-6 hidden lg:block">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">On this page</p>
        <List headings={headings} />
      </nav>
    </>
  );
}
