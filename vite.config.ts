// filepath: vite.config.ts
// Standard Vite config for Vercel
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  build: {
    target: "esnext",
    outDir: "dist",
  },
});
