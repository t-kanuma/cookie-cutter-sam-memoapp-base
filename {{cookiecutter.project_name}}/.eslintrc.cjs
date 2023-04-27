module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: ["prettier", "plugin:@typescript-eslint/recommended"],
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
};
