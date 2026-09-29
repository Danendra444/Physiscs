import Link from "next/link";
import { TOPICS, isAvailable, simsForTopic } from "@/sims/registry";

const LEVELS = [
  { level: "AS", heading: "AS Level", range: "Topics 1–11" },
  { level: "A2", heading: "A Level", range: "Topics 12–25" },
] as const;

export default function Home() {
  const available = TOPICS.filter(isAvailable);

  return (
    <div className="space-y-10">
      <section className="max-w-3xl space-y-3 pt-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Cambridge AS &amp; A Level Physics, made to revise</h1>
        <p className="text-lg text-muted">
          Clear notes, interactive simulations and virtual experiments for Cambridge International AS &amp; A Level
          Physics (9702). Free and open source. Question bank and mock tests are coming next.
        </p>
        <p className="text-sm text-muted" data-testid="available-count">
          {available.length} of {TOPICS.length} topics available so far.
        </p>
      </section>

      <section aria-labelledby="start-heading" className="space-y-4">
        <h2 id="start-heading" className="text-xl font-semibold">
          Start revising
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((topic) => (
            <li key={topic.id} className="card p-4" data-testid="featured-topic">
              <p className="text-xs font-medium text-accent">
                Topic {topic.number} · {topic.level === "AS" ? "AS Level" : "A Level"}
              </p>
              <h3 className="text-lg font-semibold">
                <Link href={`/topics/${topic.id}/`} className="hover:text-accent">
                  {topic.title}
                </Link>
              </h3>
              <p className="mt-1 text-sm text-muted">{topic.summary}</p>
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {topic.hasNotes && (
                  <li>
                    <Link href={`/topics/${topic.id}/notes/`} className="btn">
                      Notes
                    </Link>
                  </li>
                )}
                {simsForTopic(topic.id).map((sim) => (
                  <li key={sim.slug}>
                    <Link href={`/sims/${sim.slug}/`} className="btn">
                      {sim.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="syllabus-heading" className="space-y-6">
        <div>
          <h2 id="syllabus-heading" className="text-xl font-semibold">
            The full 9702 syllabus
          </h2>
          <p className="mt-1 text-sm text-muted">Topics are added over time. Dimmed topics are on the way.</p>
        </div>
        {LEVELS.map(({ level, heading, range }) => (
          <div key={level} className="space-y-3">
            <div className="flex items-baseline gap-3">
              <h3 className="font-semibold">{heading}</h3>
              <span className="text-sm text-muted">{range}</span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOPICS.filter((t) => t.level === level).map((topic) =>
                isAvailable(topic) ? (
                  <li key={topic.id} data-testid="topic-available">
                    <Link href={`/topics/${topic.id}/`} className="card flex items-baseline gap-2 border-accent px-3 py-2 hover:bg-accent-soft">
                      <span className="text-xs font-medium text-accent">{topic.number}</span>
                      <span className="font-medium">{topic.title}</span>
                    </Link>
                  </li>
                ) : (
                  <li
                    key={topic.id}
                    className="card flex items-baseline gap-2 border-dashed px-3 py-2 text-muted opacity-70"
                    data-testid="topic-soon"
                  >
                    <span className="text-xs font-medium">{topic.number}</span>
                    <span>{topic.title}</span>
                    <span className="sr-only">(coming soon)</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </section>

      <section className="card max-w-3xl space-y-2 p-5 text-sm">
        <h2 className="font-semibold">How the simulations work</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            <strong>Predict</strong>: commit to an answer before you run anything.
          </li>
          <li>
            <strong>Test</strong>: run the simulation and record readings in the data table.
          </li>
          <li>
            <strong>Analyse</strong>: choose graph axes that give a straight line, and compare the gradient with theory.
          </li>
          <li>
            <strong>Explain</strong>: answer a check question and write your conclusion.
          </li>
          <li>
            <strong>Hand in</strong>: download a summary of your work as a PDF.
          </li>
        </ol>
      </section>
    </div>
  );
}
