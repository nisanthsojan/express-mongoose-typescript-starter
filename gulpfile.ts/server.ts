import { src, dest, series } from "gulp";
import { default as gulpPug } from "gulp-pug";
import { join as pathJoin } from "path";
import { default as gulpFooter } from "gulp-footer";
import { DIST, SOURCE, BASE } from "./constants";
import { spawn } from "child_process";

const IS_PROD = process.env.NODE_ENV === "production";

export async function templates(): Promise<void> {
    if (IS_PROD) {
        const FUNCTION_NAME = "pugTemplateFunction";
        return await src(pathJoin(SOURCE.SERVER, "views") + "/**/*.pug")
            .pipe(
                gulpPug({
                    debug: false,
                    compileDebug: false,
                    inlineRuntimeFunctions: true,
                    client: true,
                    name: FUNCTION_NAME
                })
            )
            .pipe(
                gulpFooter("\nmodule.exports = <%= functionName %>;\n", {
                    functionName: FUNCTION_NAME
                })
            )
            .pipe(dest(pathJoin(DIST, "views")));
    } else {
        return console.log("Templates not needed since its development");
    }
}

export function scripts(cb: Function): void {
    const tscPath = pathJoin(BASE, "/node_modules/.bin/tsc");

    const ls = spawn(tscPath, ["-p", pathJoin(SOURCE.SERVER, "tsconfig.json")], {
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

    /**
     * This is a workaround! Currently, typescript-gulp doesn't include .json files, even if "resolveJsonModules" is
     *  enabled in .tsconfig Copy them manually for the time being...
     * @see https://github.com/ivogabe/gulp-typescript/issues/609
     */
    /*return gulp.src(path.join(DIRECTORIES.SRC_SERVER, '/!**!/!*.ts'))
        .pipe(gulpTS.createProject(path.join(DIRECTORIES.SRC_SERVER, 'tsconfig.json'))())
        .pipe(gulp.dest(DIRECTORIES.DIST));*/
}

export function statics(cb: (err?: Error) => void): NodeJS.ReadWriteStream {
    const filePaths = [
        {
            src: pathJoin(BASE, "package.json"),
            dest: DIST
        }
    ];

    if (IS_PROD) {
        filePaths.push({
            src: pathJoin(BASE, "package-lock.json"),
            dest: DIST
        });
        filePaths.push({
            src: pathJoin(SOURCE.SERVER, "Procfile"),
            dest: DIST
        });
    }

    const tasks = filePaths.map((p) => {
        const task = function (): NodeJS.ReadWriteStream {
            return src(p.src).pipe(dest(p.dest));
        };
        task.displayName = p.src;
        return task;
    });
    return series(...tasks)(cb);
}
