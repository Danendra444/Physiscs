import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SimPage } from "@/components/SimPage";
import { SIMS, getSim, getTopic } from "@/sims/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return SIMS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/sims/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const sim = getSim(slug);
  return { title: sim?.title, description: sim?.summary };
}

export default async function SimulationPage({ params }: PageProps<"/sims/[slug]">) {
  const { slug } = await params;
  const sim = getSim(slug);
  if (!sim) notFound();
  const topic = getTopic(sim.topic);

  return (
    <div className="space-y-4">
      <div className="screen-only flex flex-wrap items-center justify-between gap-2">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>{" "}
          /{" "}
          <Link href={`/topics/${sim.topic}/`} className="hover:text-ink">
            {topic?.title}
          </Link>{" "}
          / <span className="text-ink">{sim.title}</span>
        </nav>
        <span className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent">
          9702 · {sim.syllabusRefs.join(", ")}
        </span>
      </div>
      <h1 className="screen-only text-2xl font-bold tracking-tight">{sim.title}</h1>
      <SimPage slug={slug} />
    </div>
  );
}
