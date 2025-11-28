import js from "@eslint/js";
import globals from "globals";
import pluginPromise from "eslint-plugin-promise";
import nodePlugin from "eslint-plugin-n";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["package-lock.json"]),
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: globals.node },
    plugins: { js, nodePlugin, pluginPromise },
    extends: [
      "js/recommended",
      "nodePlugin/recommended",
      "pluginPromise/recommended",
    ],
    rules: {
      "n/no-unpublished-import": "off",
      "n/no-unsupported-features/node-builtins": [
        "error",
        {
          ignores: ["fetch", "Response"],
        },
      ],
    },
  },
  tseslint.configs.recommended,
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
]);
