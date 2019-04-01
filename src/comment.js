/* global $, SYS_CONST, gitbook */

require('./hbshelper');
require('./comment.less');
require('simplemde/simplemde.min.css');

const Handlebars = require('handlebars');
const SimpleMDE = require('simplemde/simplemde.min');
const commentTpl = require('./comment.hbs').default;

const Cookie = {
    set(key, value, expiration = ''/* millisecond */) {
        const _expires = () => {
            const date = new Date();
            expiration && date.setTime(date.getTime() + expiration);

            return expiration ? [`expires=${date.toUTCString()}`] : [];
        };

        document.cookie = [
            `${key}=${value}`,
            ..._expires(),
            'path=/',
        ].join(';');
    },
    get(key) {
        return document.cookie.split('; ').reduce((cookie, value) => {
            const parts = value.split('=');
            return parts[0] === key ? decodeURIComponent(parts[1]) : cookie
        }, '');
    },
    remove(key) {
        document.cookie = [`${key}=`, 'expires=Thu, 01 Jan 1970 00:00:00 GMT', 'path=/'].join(';');
    },
};

const entry = () => {
    const _showAuth = () => {
        const $authWrapper = $('.auth-wrapper');

        $authWrapper.show();
        $authWrapper.find('.auth-btn').off('click').on('click', () => {
            // noinspection JSUnresolvedFunction
            location.href = `${SYS_CONST.host}/oauth/authorize?${$.param({
                client_id: SYS_CONST.clientId,
                redirect_uri: SYS_CONST.redirect,
                response_type: 'token',
            })}`;
        });
    };

    const _showComment = (access_token) => {
        const _getComments = () => {
            const deferred = $.Deferred();
            const id = encodeURIComponent(SYS_CONST.repo);
            const prefix = `${SYS_CONST.host}/api/v4/projects/${id}/repository/commits`;
            const _url = (url, params) => `${url}?${$.param(Object.assign({
                access_token,
            }, params))}`;

            $.get(_url(prefix, {path: SYS_CONST.path})).done(data => {
                !data.length
                    ? deferred.resolve([])
                    : $.when(...data.map(({short_id}) => $.get(_url(`${prefix}/${short_id}/comments`)))).done((...result) => {
                        deferred.resolve(result.reduce((comments, item) => comments.concat(item[0]), []));
                    });
            });

            return deferred.promise();
        };

        _getComments().then(comments => {
            const $contentWrapper = $('.content-wrapper');

            $contentWrapper.find('.content').append(`<div>${comments.reduce((tpl, comment) => `${tpl}${Handlebars.compile(commentTpl)(Object.assign(comment, {
                active: comment.author.state === 'active',
            }))}`, '')}</div>`).end().find('.sign-out-btn').off('click').on('click', () => {
                /** remove cookie */
                Cookie.remove('comment.access_token');
                /** show authorization module */
                $contentWrapper.hide();
                _showAuth();
            }).end().on('click', 'i[action]', function () {
                console.log($(this));
            }).show();

            /** init editor */
            const editor = new SimpleMDE({
                element: $contentWrapper.find('.editor textarea')[0],
                status: false,
                placeholder: 'Write a comment here...',
                hideIcons: ['guide'],
            });
        });
    };

    /** extract access token and redirect */
    const hash = location.hash.substr(1).split('&').map(item => item.split('=')).reduce((obj, item) => {
        item[0] && (obj[item[0]] = item[1]);
        return obj;
    }, {});

    let accessToken;
    if (accessToken = (hash['access_token'] || Cookie.get('comment.access_token'))) {
        /** todo: check expiration of access token */
        /** update cookie */
        Cookie.set('comment.access_token', accessToken);
        _showComment(accessToken);
    } else {
        /** ask for authorizing */
        _showAuth();
    }

    /** redirect to reading page */
    hash['access_token']
        ? (location.href = `${sessionStorage.getItem('comment.auth_redirect')}#comment-wrapper`)
        : sessionStorage.setItem('comment.auth_redirect', location.href.replace(/#.*$/gi, ''));
};

// noinspection JSUnresolvedVariable
gitbook.events.bind('page.change', entry);
