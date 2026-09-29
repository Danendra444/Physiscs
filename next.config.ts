import type { NextConfig } from "next";

// On GitHub Pages the site lives under /<repo-name>/, so the deploy workflow
// sets NEXT_PUBLIC_BASE_PATH (e.g. "/physics-sim-lab"). Locally it is empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
