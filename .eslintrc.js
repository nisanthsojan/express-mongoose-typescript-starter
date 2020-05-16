module.exports = {
    root: false,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier/@typescript-eslint"
    ],
    env: {
        es6: true,
        node: true
    },
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module",
        tsconfigRootDir: __dirname,
        project: [
            "./tsconfig.json",
            "./src-server/tsconfig.json",
            "./src-public/tsconfig.json",
            "./src-tests/tsconfig.json",
            "./gulpfile.ts/tsconfig.json"
        ]
    },
    rules: {
        "@typescript-eslint/interface-name-prefix": ["error", { prefixWithI: "always" }]
    }
};
