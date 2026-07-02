import { defineConfig } from "astro/config";

// Static landing — deployed on Vercel with the project Root Directory set to `landing/`.
export default defineConfig({
  site: "https://create-saas-harness.vercel.app",
  compressHTML: true,
});
