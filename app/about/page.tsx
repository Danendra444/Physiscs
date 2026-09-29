import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <article className="max-w-3xl space-y-5 leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight">About Physics Sim Lab</h1>
      <p>
        Physics Sim Lab is a free collection of interactive simulations for Cambridge International AS &amp; A Level
        Physics (9702). Each simulation comes with a short guided activity: you predict, test, take readings, plot a graph
        and explain what you found, like a real practical but in the browser.
      </p>
      <h2 className="text-xl font-semibold">Accurate physics</h2>
      <p>
        Every simulation calculates the motion step by step from the laws of physics. Automated tests check the results
        against the standard formulas, for example that a satellite&apos;s period matches Kepler&apos;s third law to within
        0.5%.
      </p>
      <h2 className="text-xl font-semibold">Your data stays with you</h2>
      <p>
        There are no accounts. Your answers and readings are saved only in your own browser, and you can download your
        work as a PDF to hand in.
      </p>
      <h2 className="text-xl font-semibold">Open source</h2>
      <p>
        The code is MIT licensed. Teachers and students are welcome to use it, copy it and add new simulations; the
        repository&apos;s CONTRIBUTING guide explains how to add one.
      </p>
      <h2 className="text-xl font-semibold">Thanks</h2>
      <p>
        Made as a class project, with thanks to Mr. Afta, whose physics lessons and teaching tools inspired the guided
        &quot;predict first&quot; activities.
      </p>
    </article>
  );
}
