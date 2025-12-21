import js from "@eslint/js";
import globals from "globals";
import preferArrowFunctions from "eslint-plugin-prefer-arrow-functions";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    plugins: {
      "prefer-arrow-functions": preferArrowFunctions,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jquery,
        ...globals.qunit,
        sap: "readonly",
        ui5: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn",

      "prefer-arrow-callback": "error",

      "prefer-arrow-functions/prefer-arrow-functions": [
        "error",
        {
          disallowPrototype: true,
          singleReturnOnly: false,
          classPropertiesAllowed: false,
          returnStyle: "unchanged",
        },
      ],
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", "build/**"],
  },
];
