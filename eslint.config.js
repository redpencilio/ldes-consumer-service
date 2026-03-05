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
          ignores: [
            "fetch",
            "Response",
            "Headers",
            "WritableStream",
            "Request",
            "stream/web"
          ],
        },
      ],
      "n/no-process-exit": "off",
      "n/no-missing-import": [
        "error",
        {
          allowModules: ['mu', 'uuid'],
          ignoreTypeImport: true,
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,mts,cts}"],
    plugins: { tseslint },
    extends: ["tseslint/recommended"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ['tsconfig.json'],
    plugins: { json },
    language: 'json/jsonc',
    extends: ['json/recommended'],
  },
]);
