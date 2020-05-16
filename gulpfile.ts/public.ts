import { src, dest, series } from "gulp";
import { join as pathJoin } from "path";
import { BASE, DIST, DIST_PUBLIC, SOURCE } from "./constants";
import { default as gulpImageMin } from "gulp-imagemin";
import { default as favicons } from "gulp-favicons";
import { default as gulpWebpack } from "webpack-stream";
import { APP_DESCRIPTION, APP_NAME, CONTENT_HASH } from "../src-server/config/constants";
import { default as gulpSass } from "gulp-sass";
import { Options as SassOptions } from "node-sass";
import TerserPlugin from "terser-webpack-plugin";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import through2 from "through2";
import { Transform } from "stream";
import purgecss from "gulp-purgecss";

const IS_PROD = process.env.NODE_ENV === "production";

const passThroughPiperFn = function (): Transform {
    // just pass-through anything
    return through2.obj();
};

export function images(): NodeJS.ReadWriteStream {
    let piperFn = passThroughPiperFn;
    if (IS_PROD) {
        piperFn = function (): Transform {
            return gulpImageMin(
                [
                    gulpImageMin.gifsicle({
                        progressive: true,
                        optimizationLevel: 3
                    }),
                    gulpImageMin.mozjpeg({
                        quality: 60,
                        progressive: true
                    }),
                    gulpImageMin.optipng({
                        optimizationLevel: 7,
                        bitDepthReduction: true,
                        colorTypeReduction: true,
                        paletteReduction: true,
                        interlaced: null
                    }),
                    gulpImageMin.svgo({
                        plugins: [{ removeViewBox: true }, { cleanupIDs: false }]
                    })
                ],
                {
                    verbose: true
                }
            );
        };
    }

    return src(pathJoin(SOURCE.PUBLIC, "images/*"))
        .pipe(piperFn())
        .pipe(dest(pathJoin(DIST_PUBLIC, "images")));
}

export function generateFavIcons(): void {
    const favIconsViewFile = "favicons.pug";
    return src(pathJoin(SOURCE.PUBLIC, "favicon.svg"))
        .pipe(
            favicons({
                appleStatusBarStyle: "default",
                dir: "",
                display: "browser",
                lang: "en-IE",
                loadManifestWithCredentials: false,
                manifestRelativePaths: false,
                orientation: "any",
                "pixel_art": false,
                scope: "",
                "start_url": "",
                version: "",
                appName: APP_NAME,
                appShortName: APP_NAME,
                appDescription: APP_DESCRIPTION,
                developerName: "Nisanth Sojan",
                developerURL: "nisanthsojan.com",
                background: "#929292",
                "theme_color": "#28a745",
                path: "/favicons/",
                logging: true,
                html: favIconsViewFile,
                pipeHTML: true,
                replace: true,
                icons: {
                    android: false, // Create Android homescreen icon.
                    appleIcon: false, // Create Apple touch icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
                    appleStartup: false, // Create Apple startup images. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
                    coast: false, // Create Opera Coast icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
                    favicons: true, // Create regular favicons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
                    firefox: false, // Create Firefox OS icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
                    windows: false, // Create Windows 8 tile icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
                    yandex: false // Create Yandex browser icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
                }
            })
        )
        .on("error", (err: Error) => console.error(err))
        .pipe(
            dest(function (file) {
                if (favIconsViewFile === file.basename) {
                    return pathJoin(SOURCE.SERVER, "views/partials");
                }
                return pathJoin(DIST_PUBLIC, "favicons");
            })
        );
}

export function statics(cb: (err?: Error) => void): void {
    const filePaths = [
        {
            src: pathJoin(BASE, "node_modules/@fortawesome/fontawesome-free/webfonts/**/*.*"),
            dest: pathJoin(DIST_PUBLIC, "fonts/fontawesome-free")
        }
    ];
    const tasks = filePaths.map((p) => {
        const task = function (): NodeJS.ReadWriteStream {
            return src(p.src).pipe(dest(p.dest));
        };
        task.displayName = p.src;
        return task;
    });
    return series(...tasks)(cb);
}

export function scripts(): NodeJS.ReadWriteStream {
    return src(pathJoin(SOURCE.PUBLIC, "js/main.ts"))
        .pipe(
            gulpWebpack({
                entry: {
                    main: pathJoin(SOURCE.PUBLIC, "js/main.ts")
                },
                output: {
                    path: DIST,
                    filename: `public/js/[name].${CONTENT_HASH}.bundle.js`,
                    chunkFilename: `public/js/[name].${CONTENT_HASH}.bundle.js`
                },
                resolve: {
                    // Add `.ts` and `.tsx` as a resolvable extension.
                    extensions: [".ts", ".tsx", ".js"]
                },
                module: {
                    rules: [
                        // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
                        { test: /\.tsx?$/, loader: "ts-loader" }
                    ]
                },
                optimization: {
                    minimize: IS_PROD,
                    removeAvailableModules: true,
                    usedExports: true,
                    concatenateModules: true,
                    minimizer: [
                        new TerserPlugin({
                            sourceMap: false
                        })
                    ],
                    splitChunks: {
                        chunks: "all",
                        name: "vendors"
                    }
                },
                stats: "normal",
                devtool: "inline-source-map",
                mode: IS_PROD ? "production" : "development"
            })
        )
        .pipe(dest(DIST));
}

export function styles(): NodeJS.ReadWriteStream {
    let sassOptions: SassOptions = { outputStyle: "expanded" };
    let piperFn = passThroughPiperFn;
    const postCssPlugins = [
        autoprefixer({
            overrideBrowserslist: ["last 1 version", "> 1%", "ie 10"]
        })
    ];
    if (IS_PROD) {
        sassOptions = { outputStyle: "compact" };
        piperFn = function (): Transform {
            return purgecss({
                content: [
                    pathJoin(SOURCE.SERVER, "views") + "/**/*.pug",
                    pathJoin(BASE, "node_modules", "bootstrap/dist/js/bootstrap.js")
                ],
                fontFace: true,
                variables: true
            });
        };
        postCssPlugins.push(cssnano());
    }
    return src(pathJoin(SOURCE.PUBLIC, "css/**/*.scss"))
        .pipe(gulpSass(sassOptions).on("error", (err) => gulpSass.logError(err)))
        .pipe(piperFn())
        .pipe(postcss(postCssPlugins))
        .pipe(
            dest((file) => {
                file.extname = "." + CONTENT_HASH + file.extname;
                return pathJoin(DIST_PUBLIC, "css");
            })
        );
}
