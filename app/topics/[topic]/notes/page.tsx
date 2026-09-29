import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import notesIndex from "@/content/notes/index.json";
import { NotesProvider } from "@/components/notes/NotesProvider";
import { NotesToc } from "@/components/notes/NotesToc";
import { PrintButton } from "@/components/notes/PrintButton";
import type { NotesIndexFile } from "@/lib/notes/scan.mjs";
import { TOPICS, getTopic, simsForTopic } from "@/sims/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOPICS.filter((t) => t.hasNotes).map((t) => ({ topic: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/topics/[topic]/notes">): Promise<Metadata> {
  const { topic } = await params;
  const t = getTopic(topic);
  return { title: t ? `${t.title} notes` : undefined, description: t?.summary };
}

export default async function NotesPage({ params }: PageProps<"/topics/[topic]/notes">) {
  const { topic: id } = await params;
  const topic = getTopic(id);
  if (!topic?.hasNotes) notFound();

  const mod = (await import(`@/content/notes/${id}.mdx`)) as unknown as { default: ComponentType };
  const Notes = mod.default;
  const headings = (notesIndex as NotesIndexFile)[id]?.headings ?? [];
  const sims = simsForTopic(id);

  return (
    <div className="space-y-6">
      <nav className="no-print text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{" "}
        /{" "}
        <Link href={`/topics/${id}/`} className="hover:text-ink">
          {topic.title}
        </Link>{" "}
        / <span className="text-ink">Notes</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-medium text-accent">
            9702 topic {topic.number} · {topic.level === "AS" ? "AS Level" : "A Level"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{topic.title}: notes</h1>
          <p className="text-muted">{topic.summary}</p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          {sims[0] && (
            <Link href={`/sims/${sims[0].slug}/`} className="btn">
              Open simulations
            </Link>
          )}
          <PrintButton />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside>
          <NotesToc headings={headings} />
        </aside>
        <article className="notes-body min-w-0 max-w-3xl">
          <NotesProvider topic={id}>
            <Notes />
          </NotesProvider>
        </article>
      </div>
    </div>
  );
}
