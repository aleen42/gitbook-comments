/* global $, SYS_CONST, gitbook */

require('./hbshelper');
require('./comment.less');
require('simplemde/simplemde.min.css');

const Handlebars = require('handlebars');
const SimpleMDE = require('simplemde/simplemde.min');
const commentTpl = require('./comment.hbs').default;
const loadingTpl = require('./loading.hbs').default;
const editorTpl = require('./editor.hbs').default;
const Cookie = require('./cookie');
const urls = require('./urlset').of(SYS_CONST.type);

const entry = () => {
    const $contentWrapper = $('.content-wrapper');
    const $authWrapper = $('.auth-wrapper');

    const _showAuth = () => {
        /** keep to restore */
        sessionStorage.setItem('comment.auth_redirect', location.href.replace(/#.*$/gi, '').replace(/\?.*$/gi, ''));
        $authWrapper.show();
        // noinspection JSUnresolvedFunction
        $authWrapper.find('.auth-btn').off('click').on('click', () => {
            location.href = urls['oauth.redirect'];
        });
    };

    const _showComment = access_token => {
        /** url wrapper */
        const _url = (url, params) => `${url}?${$.param(Object.assign({
            access_token,
        }, params))}`;

        const _initEditor = element => new SimpleMDE({
            element,
            status: false,
            placeholder: 'Write a comment here...',
            hideIcons: ['guide'],
        });

        const _loading = $wrapper => {
            let $loadingItem = $wrapper.find('.loading-item');

            if ($loadingItem.length === 0) {
                $loadingItem = $(Handlebars.compile(loadingTpl)());
                $wrapper.append($loadingItem);
            } else {
                $loadingItem.show();
            }

            return {
                hide: () => $loadingItem.fadeOut(),
            };
        };

        /** init editor */
        const $editor = $contentWrapper.find('.editor');
        $editor.html(Handlebars.compile(editorTpl)({send: true}));
        const editor = _initEditor($editor.find('.editor textarea')[0]);

        /** loading insert */
        const $content = $contentWrapper.find('.content');
        const $contentLoading = _loading($content);

        /** show wrapper */
        $contentWrapper.show();

        /** init the avatar of authenticated user */
        return $.get(_url(urls['oauth.user'])).done(({id, avatar_url}) => {
            $contentWrapper.find('.user-avatar').on('load', function () {
                $(this).parent().css('display', 'inline-block');
            }).attr('src', avatar_url);

            const _getComments = () => {
                const deferred = $.Deferred();

                $.get(_url(urls['files.commits'], {path: SYS_CONST.path})).done(data => {
                    $.get(_url(urls['repo.comments']))
                        .done(comments => deferred.resolve(comments.filter(({path}) => (path || '') === SYS_CONST.path), data[0]));
                });

                return deferred.promise();
            };

            _getComments().then((comments, latestCommit) => {
                const _handleCommentData = ({
                    github: comment => ({
                        id: comment['id'],
                        author: {
                            avatar: comment.user['avatar_url'],
                            name: comment.user['login'],
                            username: comment.user['login'],
                            info: comment.user['html_url']
                        },
                        content: comment['body'],
                        active: true,
                        created_at: comment['created_at'],
                        updated_at: comment['updated_at'],
                        owner: comment.user['id'] === id,
                    }),
                    gitlab: comment => ({
                        id: '',
                        author: {
                            avatar: comment.author['avatar_url'],
                            name: comment.author['name'],
                            username: comment.author['username'],
                            info: comment.author['web_url']
                        },
                        content: comment['note'],
                        active: comment.author.state === 'active',
                        created_at: comment['created_at'],
                        owner: false,
                    }),
                })[SYS_CONST.type];

                $contentLoading.hide();
                $contentWrapper.find('.content .empty-comments').replaceWith(Handlebars.compile(commentTpl)(comments.map(_handleCommentData)))
                    .end().on('click', 'i[action]', function () {
                    let $loading;
                    let url;

                    const $item = $(this).closest('.comment-item');
                    const $noteItem = $item.find('.comment-note');
                    switch ($(this).attr('action')) {
                        case 'logout':
                            /** remove cookie */
                            Cookie.remove('comment.access_token');
                            /** show authorization module */
                            $contentWrapper.hide();
                            _showAuth();
                            /** scroll to the area */
                            const $page = $('.book-body .body-inner');
                            $page.animate({scrollTop: $page[0].scrollTop + $('#comment-wrapper').offset().top - 50});
                            break;
                        case 'edit':
                            url = urls['comment']($item.attr('comment-id'));
                            if (url && !$noteItem.hasClass('editor')) {
                                $noteItem.data('origin', $noteItem.html())
                                    .addClass('editor').html(Handlebars.compile(editorTpl)({modify: true}));

                                const editor = _initEditor($noteItem.find('textarea')[0]);
                                $noteItem.data('editor', editor);

                                $loading = _loading($noteItem);
                                $.get(_url(url)).done(comment => {
                                    editor.value(_handleCommentData(comment).content);
                                    $loading.hide();
                                });
                            }
                            break;
                        case 'modify':
                            url = urls['comment']($item.attr('comment-id'));
                            if (url) {
                                $loading = _loading($noteItem);
                                $.ajax({
                                    url: _url(url),
                                    type: 'PATCH',
                                    data: JSON.stringify({
                                        body: $noteItem.data('editor').value(),
                                    }),
                                    dataType: 'json',
                                    processData: false,
                                    contentType: 'application/json; charset=utf-8',
                                },).done(comment => {
                                    $item.replaceWith($(Handlebars.compile(commentTpl)([_handleCommentData(comment)])));
                                });
                            }
                            break;
                        case 'cancel':
                            $noteItem.html($noteItem.data('origin')).removeClass('editor');
                            break;
                        case 'remove':
                            url = urls['comment']($item.attr('comment-id'));
                            if (url && window.confirm('Are you sure you want to delete this?')) {
                                $loading = _loading($content);
                                $.ajax({url: _url(url), type: 'DELETE'}).done(() => {
                                    $content.find('.comment-item:visible').length === 1
                                        ? $item.replaceWith(Handlebars.compile(commentTpl)([]))
                                        : $item.fadeOut();
                                    $loading.hide();
                                });
                            }
                            break;
                        case 'send':
                            url = urls['leave.comment'](latestCommit);
                            if (url) {
                                $loading = _loading($editor);
                                $.ajax({
                                    url: _url(url),
                                    type: 'POST',
                                    data: JSON.stringify({
                                        body: editor.value(),
                                        path: SYS_CONST.path,
                                    }),
                                    dataType: 'json',
                                    processData: false,
                                    contentType: 'application/json; charset=utf-8',
                                },).done(comment => {
                                    const $emptyItem = $content.find('.empty-comments');
                                    const $item = $(Handlebars.compile(commentTpl)([_handleCommentData(comment)]));

                                    $emptyItem.length ? $emptyItem.replaceWith($item.hide()) : $item.hide().appendTo($content);
                                    $item.fadeIn();
                                    /** clear editor */
                                    editor.value('');
                                    $loading.hide();
                                });
                            }
                            break;
                    }
                });
            });
        });
    };

    const _parseParams = str => str.split('&').map(item => item.split('=')).reduce((obj, item) => {
        item[0] && (obj[item[0]] = item[1]);
        return obj;
    }, {});

    /** extract code to request for access token */
    const query = _parseParams(location.search.substr(1));

    /** extract access token and redirect */
    const hash = _parseParams(location.hash.substr(1));

    let code;
    let accessToken;

    if (code = query['code']) {
        $.post('https://gitbook-comments.herokuapp.com/gitbook-comments/auth', {code}).done(({access_token, error}) => {
            if (error) {
                /** ask for authorizing */
                _showAuth();
            }

            if (access_token) {
                /** update cookie */
                Cookie.set('comment.access_token', access_token);
                /** redirect to content wrapper */
                location.href = `${sessionStorage.getItem('comment.auth_redirect')}#comment-wrapper`;
            }
        });
    } else if (hash['access_token']) {
        /** update cookie */
        Cookie.set('comment.access_token', hash['access_token']);
        /** redirect to content wrapper */
        location.href = `${sessionStorage.getItem('comment.auth_redirect')}#comment-wrapper`;
    } else if ((accessToken = Cookie.get('comment.access_token'))) {
        _showComment(accessToken).fail(() => {
            $contentWrapper.hide();
            _showAuth();
        });
    } else {
        /** ask for authorizing */
        _showAuth();
    }
};

// noinspection JSUnresolvedVariable
gitbook.events.bind('page.change', entry);
