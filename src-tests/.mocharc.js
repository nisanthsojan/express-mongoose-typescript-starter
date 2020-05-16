"use strict";

module.exports = {
    extension: ["ts"],
    spec: "./src-tests/**/*.test.ts",
    require: "ts-node/register/transpile-only",
    slow: 7005
};
