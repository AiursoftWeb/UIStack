import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    minify: true
  },
  {
    entry: { index: "src/browser.ts" },
    format: ["iife"],
    globalName: "AiursoftMarkdownUi",
    outExtension: () => ({ js: ".global.js" }),
    sourcemap: true,
    clean: false,
    minify: true
  }
]);
