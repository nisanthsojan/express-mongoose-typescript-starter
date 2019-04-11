const {src, dest} = require('gulp');
const pug = require('gulp-pug');
const path = require('path');
const replace = require('gulp-replace');

const PATHS = {
    source_root: path.join(__dirname, 'views'),
    destination_root: path.join(__dirname, 'dist', 'views')
};


function html() {
    return src(PATHS.source_root + '/**/*.pug')
        .pipe(pug({
            debug: false,
            compileDebug: false,
            inlineRuntimeFunctions: false,
            client: true
        }))
        .pipe(replace('function template(locals)', 'module.exports = function(locals, pug)'))
        .pipe(dest(PATHS.destination_root))
}

exports.html = html;
