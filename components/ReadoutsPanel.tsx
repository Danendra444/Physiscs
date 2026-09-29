import { formatQuantity } from "@/lib/simkit/format";
import type { Readouts } from "@/lib/simkit/types";

/** Live measurements as real text, so they can be read by screen readers and copied. */
export function ReadoutsPanel({ readouts }: { readouts: Readouts }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {Object.entries(readouts).map(([id, q]) => (
        <div key={id} className="rounded-lg bg-page px-3 py-2">
          <dt className="text-xs text-muted">
            {q.label} <span className="font-serif text-ink italic">{q.symbol}</span>
          </dt>
          <dd className="font-mono text-sm tabular-nums" data-testid={`readout-${id}`}>
            {formatQuantity(q)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
