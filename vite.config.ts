import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    target: "esnext",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["cjs", "es"],
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
