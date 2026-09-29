import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPICS, getTopic, simsForTopic } from "@/sims/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/topics/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  return { title: getTopic(topic)?.title };
}

export default async function TopicPage({ params }: PageProps<"/topics/[topic]">) {
  const { topic: id } = await params;
  const topic = getTopic(id);
  if (!topic) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{" "}
        / {topic.title}
      </nav>
      <header className="max-w-3xl space-y-2">
        <p className="text-sm font-medium text-accent">
          9702 topic {topic.number} · {topic.level}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{topic.title}</h1>
        <p className="text-muted">{topic.summary}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {simsForTopic(topic.id).map((sim) => (
          <Link key={sim.slug} href={`/sims/${sim.slug}/`} className="card block p-5 hover:border-accent">
            <h2 className="text-lg font-semibold">{sim.title}</h2>
            <p className="mt-1 text-sm text-muted">{sim.summary}</p>
            <p className="mt-3 text-sm">
              <span className="text-muted">Activity:</span> {sim.content.activity.title}
            </p>
            <p className="mt-2 font-mono text-xs text-accent">9702 · {sim.syllabusRefs.join(", ")}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
