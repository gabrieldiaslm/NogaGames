import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function spaFallback(): Plugin {
  return {
    name: "spa-fallback-404",
    closeBundle() {
      const dist = join(process.cwd(), "dist");
      if (existsSync(join(dist, "index.html"))) {
        copyFileSync(join(dist, "index.html"), join(dist, "404.html"));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  server: {
    port: 5173,
  },
});