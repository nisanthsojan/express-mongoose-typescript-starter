import { task, parallel, series, watch } from "gulp";
import { templates, scripts, statics as serverStatics } from "./server";
import * as Linter from "./linter";
import * as Prettify from "./prettify";
import { DIST, SOURCE } from "./constants";
import { default as del } from "del";
import { generateFavIcons, images, statics as publicStatics, scripts as publicScripts, styles } from "./public";

task("server:template", templates);
task("server:scripts", scripts);
task("server:statics", serverStatics);

task("public:images", images);
task("public:icons", generateFavIcons);
task("public:statics", publicStatics);
task("public:scripts", publicScripts);
task("public:styles", styles);

// The below tasks affect all
task("lint:lint", Linter.lint);
task("lint:fix", Linter.fix);
task("pretty:check", Prettify.check);
task("pretty:fix", Prettify.fix);
task("clean", function () {
    return del([DIST], {
        force: true
    });
});

task(
    "build",
    series(
        "clean",
        parallel(
            images,
            publicStatics,
            publicScripts,
            styles,
            series(generateFavIcons, templates),
            scripts,
            serverStatics
        )
    )
);

function watchAll(): void {
    watch([SOURCE.SERVER + "/**/**.ts"], { ignoreInitial: true }, scripts);
    watch([SOURCE.PUBLIC + "/js/**/**.ts"], { ignoreInitial: true }, publicScripts);
    watch([SOURCE.PUBLIC + "/css/**/*.scss"], { ignoreInitial: true }, styles);
}

task("watch", series("build", watchAll));
