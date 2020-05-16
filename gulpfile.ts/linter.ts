import { join as pathJoin } from "path";
import { BASE } from "./constants";
import { spawn } from "child_process";

export function lint(cb: Function): void {
    const eslintPath = pathJoin(BASE, "/node_modules/.bin/eslint");
    const ls = spawn(eslintPath, [".", "--ext", ".ts"], {
        cwd: BASE
    });
    ls.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
    });
    ls.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
    });
    ls.on("close", (code) => {
        console.log(`child process closed with code ${code}`);
        cb();
    });
}

export function fix(cb: Function): void {
    const eslintPath = pathJoin(BASE, "/node_modules/.bin/eslint");
    const ls = spawn(eslintPath, [".", "--ext", ".ts", "--fix", ""], {
        cwd: BASE
    });
    ls.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
    });
    ls.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
    });
    ls.on("close", (code) => {
        console.log(`child process closed with code ${code}`);
        cb();
    });
}
