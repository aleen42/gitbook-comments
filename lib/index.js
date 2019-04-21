/***********************************************************************
 *                                                                   _
 *       _____  _                           ____  _                 |_|
 *      |  _  |/ \   ____  ____ __ ___     / ___\/ \   __   _  ____  _
 *      | |_| || |  / __ \/ __ \\ '_  \ _ / /    | |___\ \ | |/ __ \| |
 *      |  _  || |__. ___/. ___/| | | ||_|\ \___ |  _  | |_| |. ___/| |
 *      |_/ \_|\___/\____|\____||_| |_|    \____/|_| |_|_____|\____||_|
 *
 *      ================================================================
 *                 More than a coder, More than a designer
 *      ================================================================
 *
 *
 *      - Document: index.js
 *      - Author: aleen42
 *      - Description: the main entrance for comments-footer
 *      - Create Time: Mar 28, 2019
 *      - Update Time: Mar 28, 2019
 *
 *
 **********************************************************************/

const fs = require('fs');
const path = require('path');

const Handlebars = require('handlebars');
const tpl = (key = 'index') => fs.readFileSync(path.resolve(__dirname, `./${key}.hbs`), {encoding: 'utf8'});

/**
 * [main module]
 * @type {Object}
 */
module.exports = {
    /** Map of new style */
    book: {
        assets: './assets',
        css: ['comment.css'],
        js: ['comment.dist.js'],
    },

    /** Map of hooks */
    hooks: {
        'page:before': function (page) {
            const {output, config} = this;

            if (output.name !== 'website') {
                return page;
            }

            /**
             * [configs: config option]
             * @type {Object}
             */
            const configs = config.get('pluginsConfig')['comments-footer'] || {};
            const options = Object.assign({
                /** optional configs */
                redirect: '',
                repo: 'aleen42/PersonalWiki',
                copyright: 'Copyright © aleen42',
                type: 'github',
                host: 'https://github.com/',
                token: '',
            }, {
                /** inner states */
                path: '{{file.path}}',
            }, configs);

            if ([/** disable 'gitlab' */, 'github'].includes(options.type)) {
                const content = Handlebars.compile(tpl())({
                    modules: [
                        /** content wrapper */
                        Handlebars.compile(tpl('comment'))({
                            system: options.type === 'github' ? 'GitHub' : 'GitLab',
                            host: options.host,
                        }),
                    ],
                    copyright: Handlebars.compile(tpl('copyright'))({
                        copyright: options.copyright,
                    }),
                    SYS_CONST: JSON.stringify(options),
                });

                page.content = `${page.content}\n\n${content.replace(/[\r\n\t]/g, '')}`;
            }

            return page;
        }
    },

    /** Map of new blocks */
    blocks: {},

    /** Map of new filters */
    filters: {},
};
