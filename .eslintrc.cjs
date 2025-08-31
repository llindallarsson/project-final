module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: "detect" },
  },
  plugins: ["react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  // Let ESLint know about import.meta (Vite)
  globals: {
    "import.meta": "readonly",
  },
  rules: {
    // React 17+ new JSX transform – no need to import React
    "react/react-in-jsx-scope": "off",
    // Optional: fewer hard errors while you refactor
    "no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "react/prop-types": "off",
  },
};
