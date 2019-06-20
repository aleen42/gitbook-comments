/* global $, SYS_CONST, gitbook */

require('./hbshelper');
require('./comment.less');

const Handlebars = require('handlebars');
const SimpleMDE = require('simplemde/simplemde.min');
const commentTpl = require('./comment.hbs').default;
const loadingTpl = require('./loading.hbs').default;
const editorTpl = require('./editor.hbs').default;
const Cookie = require('./cookie');
const urls = require('./urlset').of(SYS_CONST.type);
const isGitLab = SYS_CONST.type === 'gitlab';

const entry = () => {
    const $contentWrapper = $('.content-wrapper');

    const $commentWrapper = $contentWrapper.find('.comment-wrapper');
    const $editorWrapper = $contentWrapper.find('.editor-wrapper');
    const $authWrapper = $contentWrapper.find('.auth-wrapper');

    /** url wrapper */
    const _wrapUrl = access_token => (url, params) => `${url}?${$.param(Object.assign(access_token ? {
        access_token,
    } : {}, params))}`;

    /** editor initialization wrapper */
    const _initEditor = element => new SimpleMDE({
        element,
        status: false,
        placeholder: 'Write a comment here...',
        hideIcons: ['guide'],
    });

    /** loading wrapper */
    const _loading = $wrapper => {
        let $loadingItem = $wrapper.find('.loading-item');

        if ($loadingItem.length === 0) {
            $loadingItem = $(Handlebars.compile(loadingTpl)());
            $wrapper.append($loadingItem);
        } else {
            $loadingItem.show();
        }

        return {
            hide: ($item => () => $item.fadeOut())($loadingItem),
        };
    };

    /** comment data handler */
    const _handleCommentData = ({
        github: (comment, currentUserId) => ({
            id: comment['id'],
            author: {
                avatar: comment.user['avatar_url'],
                name: comment.user['login'],
                username: comment.user['login'],
                info: comment.user['html_url']
            },
            content: comment['body'].replace(/@(\w+)/g, `[$&](https://github.com/$1)`)
                .replace(/\n\n—\n\n\[View it on GitBook]\(.*?\)/g, ''),
            active: true,
            created_at: comment['created_at'],
            updated_at: comment['updated_at'],
            owner: comment.user['id'] === currentUserId,
        }),
        gitlab: (comment, currentUserId) => ({
            id: comment['id'],
            author: {
                avatar: comment.author['avatar_url'],
                name: comment.author['name'],
                username: comment.author['username'],
                info: comment.author['web_url']
            },
            content: comment['body'].replace(/@(\w+)/g, `[$&](${SYS_CONST.host}/$1)`)
                .replace(/\n\n—\n\n\[View it on GitBook]\(.*?\)/g, ''),
            active: comment.author.state === 'active',
            created_at: comment['created_at'],
            updated_at: comment['updated_at'],
            owner: comment.author['id'] === currentUserId,
            commitId: comment.commitId,
            discussionId: comment.discussionId,
        }),
    })[SYS_CONST.type];

    const _showComment = (token, uid, editor) => {
        const _url = _wrapUrl(token);

        $commentWrapper.show();

        /** loading insert */
        const $content = $contentWrapper.find('.comment-list');
        const $contentLoading = _loading($content);

        const _getComments = () => {
            const deferred = $.Deferred();

            $.get(_url(urls['files.commits'], {path: SYS_CONST.path})).done(data => {
                $.when.apply($, (isGitLab
                    ? data.map(commit => _url(urls['commit.comments'](commit)))
                    : [_url(urls['repo.comments'])]).map((url, index) => {
                        const dfd = $.Deferred();
                        $.get(url).done(result => {
                            dfd.resolve(isGitLab ? result.map((({id, notes}) => Object.assign(notes[0], {
                                discussionId: id,
                                commitId: data[index].id,
                            }))) : result);
                        });
                        return dfd.promise();
                    })
                ).done((...comments) => {
                    comments = [].concat(...comments);

                    if (isGitLab) {
                        $.get(_url(urls['commit.diff'](data[0]))).done(diffs => diffs.forEach(({new_path, diff}) => {
                            new_path === SYS_CONST.path && deferred.resolve(
                                comments.filter(comment => (comment.position && comment.position['new_path'] || '') === SYS_CONST.path)
                                , Object.assign(data[0], {
                                    diff: Object.assign(diff, {
                                        /** @@ -48,4 +48,6 @@ */
                                        /** @@ -0,0 +1,48 @@ */
                                        oldLine: diff.match(/@@\s(.*?)\s\+.*?\s@@/i)[1]
                                            .split(',')
                                            .reduce((line, i) => line + parseInt(i, 10), 0) - 1,
                                        newLine: diff.match(/@@\s.*?\s\+(.*?)\s@@/i)[1]
                                            .split(',')
                                            .reduce((line, i) => line + parseInt(i, 10), 0) - 1
                                    }),
                                })
                            );
                        }));
                    } else {
                        deferred.resolve(comments.filter(({path}) => (path || '') === SYS_CONST.path), data[0]);
                    }

                });
            });

            return deferred.promise();
        };

        _getComments().then((comments, latestCommit) => {
            $contentLoading.hide();
            $contentWrapper.find('.comment-list .empty-comments')
                .replaceWith(Handlebars.compile(commentTpl)(comments.map(comment => _handleCommentData(comment, uid))));

            uid && $contentWrapper.off('click').on('click', 'i[action]', function () {
                let $loading;
                let url;

                const $item = $(this).closest('.comment-item');
                const $noteItem = $item.find('.comment-note');
                switch ($(this).attr('action')) {
                    case 'logout':
                        /** remove cookie */
                        Cookie.remove('comment.access_token');
                        $editorWrapper.hide();
                        /** ask for authorizing */
                        _showAuth();
                        /** scroll to the area */
                        const $page = $('.book-body .body-inner');
                        $page.animate({scrollTop: $page[0].scrollTop + $('#comment-wrapper').offset().top - 50});
                        break;
                    case 'edit':
                        url = isGitLab
                            ? urls['comment'](void 0, $item.attr('commit-id'), $item.attr('discussion-id'))
                            : urls['comment']($item.attr('comment-id'));

                        if (url && !$noteItem.hasClass('editor')) {
                            $noteItem.data('origin', $noteItem.html())
                                .addClass('editor').html(Handlebars.compile(editorTpl)({modify: true}));

                            const editor = _initEditor($noteItem.find('textarea')[0]);
                            $noteItem.data('editor', editor);

                            $loading = _loading($noteItem);
                            $.get(_url(url)).done(comment => {
                                editor.value(_handleCommentData(isGitLab ? Object.assign(comment.notes[0], {
                                    commitId: $item.attr('commit-id'),
                                    discussionId: $item.attr('discussion-id'),
                                }) : comment, uid).content);
                                $loading.hide();
                            });
                        }
                        break;
                    case 'modify':
                        url = urls['comment']($item.attr('comment-id'), $item.attr('commit-id'), $item.attr('discussion-id'));
                        if (url) {
                            $loading = _loading($noteItem);
                            $.ajax({
                                url: _url(url),
                                type: isGitLab ? 'PUT' : 'PATCH',
                                data: JSON.stringify({
                                    body: `${$noteItem.data('editor').value()}\n\n—\n\n[View it on GitBook](${location.href.replace(/#.*$/gi, '')}#comment-wrapper)`,
                                }),
                                dataType: 'json',
                                processData: false,
                                contentType: 'application/json; charset=utf-8',
                            },).done(comment => {
                                $item.replaceWith($(Handlebars.compile(commentTpl)([_handleCommentData(isGitLab ? Object.assign(comment, {
                                    commitId: $item.attr('commit-id'),
                                    discussionId: $item.attr('discussion-id'),
                                }) : comment, uid)])));
                            });
                        }
                        break;
                    case 'cancel':
                        $noteItem.html($noteItem.data('origin')).removeClass('editor');
                        break;
                    case 'remove':
                        url = urls['comment']($item.attr('comment-id'), $item.attr('commit-id'), $item.attr('discussion-id'));
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
                            $loading = _loading($contentWrapper.find('.editor'));
                            $.ajax({
                                url: _url(url),
                                type: 'POST',
                                data: JSON.stringify(Object.assign({
                                    body: `${editor.value()}\n\n—\n\n[View it on GitBook](${location.href.replace(/#.*$/gi, '')}#comment-wrapper)`,
                                }, isGitLab ? {
                                    position: Object.assign({
                                        'base_sha': latestCommit.parent_ids[0],
                                        'start_sha': latestCommit.parent_ids[0],
                                        'head_sha': latestCommit.id,
                                        'position_type': 'text',
                                        'new_path': SYS_CONST.path,
                                        /** create a discussion at the last line of the specific commit */
                                        'new_line': latestCommit.diff.newLine,
                                    }, latestCommit.diff.oldLine > 0 ? {
                                        'old_line': latestCommit.diff.oldLine,
                                    } : {}),
                                } : {path: SYS_CONST.path})),
                                dataType: 'json',
                                processData: false,
                                contentType: 'application/json; charset=utf-8',
                            },).done(comment => {
                                const $emptyItem = $content.find('.empty-comments');
                                const $item = $(Handlebars.compile(commentTpl)([_handleCommentData(isGitLab ? Object.assign(comment.notes[0], {
                                    commitId: latestCommit.id,
                                    discussionId: comment.id,
                                }) : comment, uid)]));

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
    };

    const _showEditor = token => {
        const _url = _wrapUrl(token);

        $editorWrapper.show();

        /** init editor */
        const $editor = $contentWrapper.find('.editor');
        $editor.html(Handlebars.compile(editorTpl)({send: true}));
        const editor = _initEditor($editor.find('.editor textarea')[0]);

        /** init the avatar of authenticated user */
        return $.get(_url(urls['oauth.user'])).done(({id, avatar_url}) => {
            $contentWrapper.find('.user-avatar').on('load', function () {
                $(this).parent().css('display', 'inline-block');
            }).attr('src', avatar_url);

            _showComment(token, id, editor);
        });
    };

    const _showAuth = () => {
        $authWrapper.show().find('.auth-btn').off('click').on('click', () => {
            location.href = urls['oauth.redirect']();
        });

        isGitLab ? $commentWrapper.hide() : $.post(urls['token']).done(({token}) => _showComment(SYS_CONST.token || token));
    };

    const _parseParams = str => str.split('&').map(item => item.split('=')).reduce((obj, item) => {
        item[0] && (obj[item[0]] = item[1]);
        return obj;
    }, {});

    /** extract access token and redirect */
    const hash = _parseParams(location.hash.substr(1));

    const _run = token => {
        _showEditor(token).fail(() => {
            $editorWrapper.hide();
            /** ask for authorizing */
            _showAuth();
        });
    };

    let accessToken;
    if (hash['access_token']) {
        /** update cookie */
        Cookie.set('comment.access_token', hash['access_token']);
        _run(hash['access_token']);
        /** scroll to content wrapper */
        location.href = `${location.href.replace(/#.*$/gi, '')}#comment-wrapper`;
    } else if ((accessToken = Cookie.get('comment.access_token'))) {
        _run(accessToken);
    } else {
        /** ask for authorizing */
        _showAuth();
    }
};

// noinspection JSUnresolvedVariable
gitbook.events.bind('page.change', entry);
