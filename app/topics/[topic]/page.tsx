import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import notesIndex from "@/content/notes/index.json";
import { NotesProgressSummary } from "@/components/notes/NotesProgressSummary";
import type { NotesIndexFile } from "@/lib/notes/scan.mjs";
import { availableTopics, getTopic, isAvailable, simsForTopic } from "@/sims/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return availableTopics().map((t) => ({ topic: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/topics/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  return { title: getTopic(topic)?.title };
}

export default async function TopicPage({ params }: PageProps<"/topics/[topic]">) {
  const { topic: id } = await params;
  const topic = getTopic(id);
  if (!topic || !isAvailable(topic)) notFound();

  const sims = simsForTopic(id);
  const notes = (notesIndex as NotesIndexFile)[id];

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{" "}
        / {topic.title}
      </nav>
      <header className="max-w-3xl space-y-2">
        <p className="text-sm font-medium text-accent">
          9702 topic {topic.number} · {topic.level === "AS" ? "AS Level" : "A Level"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{topic.title}</h1>
        <p className="text-muted">{topic.summary}</p>
      </header>

      {topic.hasNotes && (
        <section aria-labelledby="notes-heading" className="space-y-3">
          <h2 id="notes-heading" className="text-xl font-semibold">
            Notes
          </h2>
          <Link href={`/topics/${id}/notes/`} className="card block max-w-2xl p-5 hover:border-accent" data-testid="notes-card">
            <h3 className="text-lg font-semibold">Read the notes →</h3>
            <p className="mt-1 text-sm text-muted">
              Definitions, key equations, worked examples, common mistakes and exam tips, with quick self-checks.
              {notes ? ` ${notes.checks.length} self-checks and a checklist.` : ""}
            </p>
            <div className="mt-3">
              <NotesProgressSummary topic={id} />
            </div>
          </Link>
        </section>
      )}

      {sims.length > 0 && (
        <section aria-labelledby="sims-heading" className="space-y-3">
          <h2 id="sims-heading" className="text-xl font-semibold">
            Simulations and experiments
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sims.map((sim) => (
              <Link key={sim.slug} href={`/sims/${sim.slug}/`} className="card block p-5 hover:border-accent">
                <h3 className="text-lg font-semibold">{sim.title}</h3>
                <p className="mt-1 text-sm text-muted">{sim.summary}</p>
                <p className="mt-3 text-sm">
                  <span className="text-muted">Activity:</span> {sim.content.activity.title}
                </p>
                <p className="mt-2 font-mono text-xs text-accent">9702 · {sim.syllabusRefs.join(", ")}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
