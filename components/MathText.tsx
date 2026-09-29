import katex from "katex";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Text with inline maths between $…$ signs, rendered with KaTeX. Content comes from our own content.ts files. */
export function MathText({ text, className }: { text: string; className?: string }) {
  const html = text
    .split(/(\$[^$]+\$)/g)
    .map((part) =>
      part.startsWith("$") && part.endsWith("$") && part.length > 1
        ? katex.renderToString(part.slice(1, -1), { throwOnError: false })
        : escapeHtml(part),
    )
    .join("");
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** A displayed equation. */
export function MathBlock({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: true });
  return <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />;
}
