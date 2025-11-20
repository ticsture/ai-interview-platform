/**
 * ESLint configuration for the Next.js + TypeScript project.
 * We compose Next.js recommended presets (core web vitals + TS) and then
 * override the default ignore patterns so we are explicit about what is skipped.
 * Adjust or extend rules by pushing additional config objects into defineConfig.
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Next.js web vitals rules (performance & best practices)
  ...nextVitals,
  // TypeScript specific linting rules
  ...nextTs,
  // Override default ignores of eslint-config-next so we are explicit.
  globalIgnores([
    // Build / output artifacts we never lint.
    ".next/**",
    "out/**",
    "build/**",
    // Generated type helper
    "next-env.d.ts",
  ]),
]);

// Export composed configuration object
export default eslintConfig;
