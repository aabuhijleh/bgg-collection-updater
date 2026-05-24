import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  // ESLint runs only for react-hooks rules that Biome doesn't yet implement
  // (e.g. the React Compiler checks). Lint/format everything else via Biome.
  {
    ...reactHooks.configs.flat.recommended,
    files: ["src/**/*.ts*"],
    languageOptions: { parser: tsParser },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      // Disabled: Biome's lint/correctness/useExhaustiveDependencies covers this.
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      "src/components/ui/**",
      "src/routeTree.gen.ts",
    ],
  },
]);
