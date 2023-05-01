module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: ["plugin:@typescript-eslint/recommended", "prettier"],
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
};
