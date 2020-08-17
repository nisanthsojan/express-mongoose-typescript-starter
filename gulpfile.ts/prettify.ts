import { join as pathJoin } from "path";
import { BASE } from "./constants";
import { spawn } from "child_process";
import { ICallbackFunction } from "./_types";

const mPath = pathJoin(BASE, "/node_modules/.bin/prettier");
const cPath = pathJoin(BASE, "prettier.config.js");
const iPath = pathJoin(BASE, ".prettierignore");
const sPath = pathJoin(BASE, "**/*.*");

export function check(cb: ICallbackFunction): void {
    const ls = spawn(mPath, [sPath, "--check", "--config", cPath, "--ignore-path", iPath], {
        cwd: BASE
    });
    ls.stdout.on("data", (data) => {
        console.log(data.toString());
    });
    /*ls.stderr.on("data", (data) => {
        //console.error(`stderr: ${data}`);
        // do we need this? as this only outputs no parser error for files like jpeg,png, etc..s
    });*/
    ls.on("close", (code) => {
        console.log(`child process closed with code ${code}`);
        cb();
    });
}

export function fix(cb: ICallbackFunction): void {
    const ls = spawn(mPath, [sPath, "--write", "--config", cPath, "--ignore-path", iPath], {
        cwd: BASE
    });
    ls.stdout.on("data", (data) => {
        console.log(`stdout: ${data.toString() as string}`);
    });
    /*ls.stderr.on("data", (data) => {
        // console.error(`stderr: ${data}`);
    });*/
    ls.on("close", (code) => {
        console.log(`child process closed with code ${code}`);
        cb();
    });
}
