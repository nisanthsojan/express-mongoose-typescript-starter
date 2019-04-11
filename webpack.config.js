const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: './src-public/js/main.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'public/js/main.bundle.js'
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {test: /\.tsx?$/, loader: "ts-loader"}
        ]
    },
    optimization: {
        minimizer: [new TerserPlugin({
            sourceMap: false
        })],
    }
};
