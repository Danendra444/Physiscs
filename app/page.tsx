import Link from "next/link";
import { TOPICS, simsForTopic } from "@/sims/registry";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl space-y-3 pt-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Interactive physics simulations for A Level</h1>
        <p className="text-lg text-muted">
          Predict what will happen, test it, take readings, and find the relationship from your own graph. Built for
          Cambridge International AS &amp; A Level Physics (9702). Free and open source.
        </p>
      </section>

      <section className="space-y-6">
        {TOPICS.map((topic) => (
          <div key={topic.id}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="text-xl font-semibold">
                <Link href={`/topics/${topic.id}/`} className="hover:text-accent">
                  {topic.number}. {topic.title}
                </Link>
              </h2>
              <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">{topic.level}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {simsForTopic(topic.id).map((sim) => (
                <Link key={sim.slug} href={`/sims/${sim.slug}/`} className="card block p-4 hover:border-accent">
                  <h3 className="font-semibold">{sim.title}</h3>
                  <p className="mt-1 text-sm text-muted">{sim.summary}</p>
                  <p className="mt-3 font-mono text-xs text-accent">9702 · {sim.syllabusRefs.join(", ")}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="card max-w-3xl space-y-2 p-5 text-sm">
        <h2 className="font-semibold">How each simulation works</h2>
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
