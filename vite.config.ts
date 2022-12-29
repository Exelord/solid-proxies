/// <reference types="vitest" />

import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["cjs", "es"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["solid-js"],
    },
  },
  test: {
    transformMode: {
      web: [/\.[jt]s$/],
    },
  },
});
