import Link from "next/link";
import { getSim } from "@/sims/registry";

/** A card linking to a simulation that shows the idea in action. Renders nothing for an unknown slug. */
export function TrySim({ slug }: { slug: string }) {
  const sim = getSim(slug);
  if (!sim) return null;
  return (
    <Link
      href={`/sims/${sim.slug}/`}
      className="notes-trysim card no-print my-5 block p-4 hover:border-accent"
      data-testid="try-sim"
    >
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">Try it in a simulation</p>
      <p className="mt-1 font-semibold">{sim.title} →</p>
      <p className="mt-1 text-sm text-muted">{sim.summary}</p>
    </Link>
  );
}
