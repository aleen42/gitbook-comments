/*
 *                                                               _
 *   _____  _                           ____  _                 |_|
 *  |  _  |/ \   ____  ____ __ ___     / ___\/ \   __   _  ____  _
 *  | |_| || |  / __ \/ __ \\ '_  \ _ / /    | |___\ \ | |/ __ \| |
 *  |  _  || |__. ___/. ___/| | | ||_|\ \___ |  _  | |_| |. ___/| |
 *  |_/ \_|\___/\____|\____||_| |_|    \____/|_| |_|_____|\____||_|
 *
 *  ===============================================================
 *             More than a coder, More than a designer
 *  ===============================================================
 *
 *  - Document: webpack.config.js
 *  - Author: aleen42
 *  - Description: A configuration file for configuring Webpack
 *  - Create Time: Apr 1st, 2019
 *  - Update Time: Apr 1st, 2019
 *
 */

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: './src/comment.js',
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
        publicPath: '',
        path: path.join(__dirname, 'assets'),
        filename: 'comment.dist.js',
    },
    resolve: {
        extensions: ['.js'],
        modules: [path.resolve(__dirname, 'src/'), 'node_modules'],
        alias: {
            'handlebars' : 'handlebars/dist/handlebars.js',
            'marked': 'marked/marked.min.js',
            'simplemde': 'simplemde/dist',
        },
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'comment.css',
        }),
    ],
    module: {
        rules: [
            {test: /\.hbs$/, loader: 'raw-loader'},
            {test: /\.(less|css)$/, loader: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']},
            {
                /** babel */
                test: /\.js?$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env', 'es2015'],
                    },
                },
            },
        ],
    },
};
