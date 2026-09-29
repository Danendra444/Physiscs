import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// On GitHub Pages the site lives under /<repo-name>/, so the deploy workflow
// sets NEXT_PUBLIC_BASE_PATH (e.g. "/Physics"). Locally it is empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

// Plugins are given by name (not imported) because Turbopack can't take functions.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-math"],
    rehypePlugins: ["rehype-slug", "rehype-katex"],
  },
});

export default withMDX(nextConfig);
