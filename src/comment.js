/* global $, SYS_CONST, gitbook, __ENV_ACCESS_TOKEN__ */

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
    /** all users data */
    let users = [];

    const $contentWrapper = $('.content-wrapper');

    const $commentWrapper = $contentWrapper.find('.comment-wrapper');
    const $editorWrapper = $contentWrapper.find('.editor-wrapper');
    const $authWrapper = $contentWrapper.find('.auth-wrapper');

    /** url wrapper */
    const _wrapUrl = accessToken => (url, params) => {
        if (isGitLab) {
            return `${url}?${$.param(Object.assign(accessToken ? {
                access_token: accessToken,
            } : {}, params))}`
        } else {
            accessToken && $.ajaxSetup({
                headers: {Authorization: `token ${accessToken}`},
            });
            return `${url}?${$.param(params || {})}`
        }
    };

    /** editor initialization wrapper */
    const _initEditor = (element, autofocus = false) => {
        const editor = new SimpleMDE({
            autofocus,
            element,
            status: false,
            placeholder: 'Write a comment here...',
            hideIcons: ['guide'],
            autoDownloadFontAwesome: false,
        });

        /** init user auto matching */
        let $hook;
        const mirror = editor.codemirror;
        const doc = mirror.doc;
        const _destroyHint = () => {
            /** clear */
            $hook && $hook.remove();
            $hook = null;
        };

        const _append = $target => {
            const {line, ch} = doc.getCursor();
            const beforeContent = doc.getRange({line: 0, ch: 0}, {line, ch});
            const name = $target.data('name');
            doc.replaceRange(`@${name} `, {line, ch: ch - beforeContent.length + beforeContent.lastIndexOf('@')}, {
                line,
                ch,
            });
            mirror.focus();
            mirror.doc.setCursor(line, ch + `@${name} `.length - `@${/(?:\s|^)@(\w*)$/.exec(beforeContent)[1]}`.length);
        };

        const _handleHint = () => {
            if (!users.length) return;
            const {line, ch} = doc.getCursor();
            let input;
            if (!(input = /(?:\s|^)@(\w*)$/.exec(doc.getRange({line: 0, ch: 0}, {line, ch})))) return _destroyHint();
            /** calculate position in a next event loop */
            setTimeout(() => {
                /** insert hook */
                !$hook && $(window.getSelection().focusNode).closest('.CodeMirror').before($hook = $('<div class="auto-hint"><ul></ul></div>'));
                $hook.css({
                    left: `${$hook.next().children().first().position().left - 10}px`,
                    top: `${$hook.next().children().first().position().top + 70}px`,
                }).find('ul')
                    .html(users.filter(({username}, index) => !input[1]
                        ? index < 20
                        : username.indexOf(input[1]) > -1)
                        .map(({username, name, avatar_url: avatar}) => `<li data-name="${username}">
                            <img src="${avatar}" class="user-avatar" alt="avatar"/>
                            <span class="username">${username}</span>
                            ${name ? `<span class="name">${name}</span>` : ''}
                        </li>`)
                    )
                    .off('click')
                    .on('click', 'li', function () {
                        _append($(this));
                        return false;
                    });
            });
        };

        mirror.on('keydown', (instance, e) => {
            const code = e.keyCode || e.which;
            if ([/* up = */38, /* down = */40, /* enter = */13, /* esc = */27].includes(code)) {
                if (!$hook) return;
                _stop(e);
                /** esc */
                if (code === 27) return _destroyHint();

                const $ul = $hook.find('ul');
                const $active = $ul.find('li.active');
                /** enter */
                if (code === 13) return _append($active.length ? $active : $ul.find('li').first());
                /** up or down */
                if (!$active.length) return $ul.find('li').first().addClass('active');
                let $target = $active[code === 38 ? 'prev' : 'next']();
                /** select first or last */
                !$target.length && ($target = $ul.find('li')[code === 38 ? 'last' : 'first']());
                $active.removeClass('active');
                $target.addClass('active');
                /** scroll to outside item */
                $hook.prop('scrollTop', (index, val) => {
                    const [up, down] = [
                        $target.offset().top - $ul.offset().top,
                        $target.offset().top - $ul.offset().top + $target.outerHeight() - $hook.outerHeight(),
                    ];
                    return val < down ? down : val > up ? up : val;
                });
            }
        });
        mirror.on('blur', () => setTimeout(_destroyHint, 200));
        /** wait for appending */
        mirror.on('focus', _handleHint);
        mirror.on('change', _handleHint);
        mirror.on('cursorActivity', _handleHint);
        return editor;
    };

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
        github: (comment, currentUserId, replace = true) => ({
            type: 'github',
            id: comment['id'],
            author: {
                avatar: comment.user['avatar_url'],
                name: comment.user['login'],
                username: comment.user['login'],
                info: comment.user['html_url'],
            },
            content: comment['body'].replace(/@(\w+)/g, replace ? '[$&](https://github.com/$1)' : '$&')
                .replace(/\n\n—\n\n\[View it on GitBook]\(.*?\)/g, ''),
            active: true,
            created_at: comment['created_at'],
            updated_at: comment['updated_at'],
            owner: comment.user['id'] === currentUserId,
        }),
        gitlab: (comment, currentUserId, replace = true) => ({
            type: 'gitlab',
            id: comment['id'],
            author: {
                avatar: comment.author['avatar_url'],
                name: comment.author['name'],
                username: comment.author['username'],
                info: comment.author['web_url'],
            },
            content: comment['body'].replace(/@(\w+)/g, replace ? `[$&](${SYS_CONST.host}/$1)` : '$&')
                .replace(/\n\n—\n\n\[View it on GitBook]\(.*?\)/g, ''),
            active: comment.author.state === 'active',
            created_at: comment['created_at'],
            updated_at: comment['updated_at'],
            owner: comment.author['id'] === currentUserId,
            commitId: comment.commitId,
            discussionId: comment.discussionId,
        }),
    })[SYS_CONST.type];

    const _getRecursively = (url, onEmpty) => {
        const deferred = $.Deferred();
        let _recursive;
        let result = [];

        (_recursive = pageNum => {
            $.get(url, {
                page: pageNum,
                'per_page': 100,
            }).done(data => {
                if (data.length) {
                    result = [...result, ...data];
                    _recursive(++pageNum);
                } else {
                    if (!result.length) {
                        onEmpty ? onEmpty(deferred) : deferred.resolve(result);
                        return;
                    }

                    deferred.resolve(result);
                }
            }).fail(deferred.reject);
        })(1);

        return deferred.promise();
    };

    const _showComment = (token, uid, editor) => {
        const _url = _wrapUrl(token);

        $commentWrapper.show();

        /** loading insert */
        const $content = $contentWrapper.find('.comment-list');
        const $contentLoading = _loading($content);

        const _getComments = () => {
            const deferred = $.Deferred();

            _getRecursively(_url(urls['files.commits'], {
                path: SYS_CONST.path,
                all: true,
            }), deferred => {
                /** sometimes the commit may lose when searching all commits */
                _getRecursively(_url(urls['files.commits'], {
                    path: SYS_CONST.path,
                    all: false,
                })).then(result => deferred.resolve(result));
            }).then(commits => {
                $.when.apply($, (isGitLab
                    ? commits.map(commit => _url(urls['commit.comments'](commit)))
                    : [_url(urls['repo.comments'])]
                ).map((url, index) => {
                    const dfd = $.Deferred();
                    _getRecursively(url).then(result => {
                        dfd.resolve(isGitLab ? result.map(({id, notes}) => notes.map(note => Object.assign(note, {
                            discussionId: id,
                            commitId: commits[index].id,
                        }))) : result);
                    });
                    return dfd.promise();
                })).done((...comments) => {
                    comments = [].concat(...comments);

                    if (isGitLab) {
                        /** resolve [[note1, note2], note, ...] */
                        $.get(_url(urls['commit.diff'](commits[commits.length - 1]))).done(diffs => diffs.forEach(({new_path: newPath, diff}) => {
                            newPath === SYS_CONST.path && deferred.resolve(
                                comments.map(comment => comment.filter(c => ((c.position && c.position['new_path']) || '') === SYS_CONST.path)).filter(comment => comment.length)
                                , Object.assign(commits[commits.length - 1], {
                                    diff: Object.assign(diff, {
                                        /** @@ -48,4 +48,6 @@ */
                                        /** @@ -0,0 +1,48 @@ */
                                        oldLine: diff.match(/@@\s-(.*?)\s\+.*?\s@@/i)[1]
                                            .split(',')
                                            .reduce((line, i) => line + parseInt(i, 10), 0) - 1,
                                        newLine: diff.match(/@@\s-.*?\s\+(.*?)\s@@/i)[1]
                                            .split(',')
                                            .reduce((line, i) => line + parseInt(i, 10), 0) - 1,
                                    }),
                                })
                            );
                        }));
                    } else {
                        /** resolve [[comment], [comment], ...] */
                        deferred.resolve(comments.filter(({path}) => (path || '') === SYS_CONST.path).map(comment => {
                            /** init users who have leaved comments in this repo within GitHub */
                            const user = comment.user;
                            users.findIndex(({id}) => id === user.id) === -1 && (users = [...users, {
                                id: user.id,
                                username: user.login,
                                avatar_url: user.avatar_url,
                            }]);
                            /** construct comment */
                            return [].concat(comment);
                        }), commits[commits.length - 1]);
                    }
                });
            });

            return deferred.promise();
        };

        _getComments().then((comments, latestCommit) => {
            $contentLoading.hide();
            /** [[comment], [comment], ...] */
            $contentWrapper.find('.comment-list .empty-comments')
                .replaceWith(Handlebars.compile(commentTpl)(comments.map(comment => comment.map(c => _handleCommentData(c, uid)))));

            uid && $contentWrapper.off('click').on('click', 'i[data-action],div[data-action]', function () {
                let $loading;
                let url;

                const $item = $(this).closest('.comment-item');
                const $noteItem = $(this).closest('.note-item');
                const $comment = $noteItem.find('.comment-note');
                const $replyWrapper = $item.find('.reply-wrapper');

                switch ($(this).data('action')) {
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
                    if (!$comment.hasClass('editor')) {
                        $comment.data('origin', $comment.html())
                            .addClass('editor').html(Handlebars.compile(editorTpl)({modify: true}));

                        const editor = _initEditor($comment.find('textarea')[0], true);
                        $comment.data('editor', editor);
                        editor.value(JSON.parse($comment.data('content')));
                    }
                    break;
                case 'doEdit':
                    url = urls['comment']($noteItem.attr('comment-id'), $item.attr('commit-id'), $item.attr('discussion-id'));
                    if (url) {
                        $loading = _loading($comment);
                        $.ajax({
                            url: _url(url),
                            type: isGitLab ? 'PUT' : 'PATCH',
                            data: JSON.stringify({
                                body: `${$comment.data('editor').value()}\n\n—\n\n[View it on GitBook](${location.href.replace(/#.*$/gi, '')}#comment-wrapper)`,
                            }),
                            dataType: 'json',
                            processData: false,
                            contentType: 'application/json; charset=utf-8',
                        }).done(comment => {
                            $noteItem.replaceWith($(Handlebars.compile(commentTpl)([[_handleCommentData(isGitLab ? Object.assign(comment, {
                                commitId: $item.attr('commit-id'),
                                discussionId: $item.attr('discussion-id'),
                            }) : comment, uid)]])).find('.note-item'));
                        });
                    }
                    break;
                case 'cancelEdit':
                    $comment.html($comment.data('origin')).removeClass('editor');
                    break;
                case 'reply':
                    $replyWrapper.html(Handlebars.compile(editorTpl)({reply: true}));
                    $replyWrapper.data('editor', _initEditor($replyWrapper.find('textarea')[0], true));
                    break;
                case 'doReply':
                    url = urls['comment'](void 0, $item.attr('commit-id'), $item.attr('discussion-id'));
                    if (url) {
                        $loading = _loading($replyWrapper);
                        $.ajax({
                            url: _url(url),
                            type: 'POST',
                            data: JSON.stringify({
                                body: `${$replyWrapper.data('editor').value()}\n\n—\n\n[View it on GitBook](${location.href.replace(/#.*$/gi, '')}#comment-wrapper)`,
                            }),
                            dataType: 'json',
                            processData: false,
                            contentType: 'application/json; charset=utf-8',
                        }).done(comment => {
                            const $note = $(`
                                    <div class="slider"></div>
                                    ${$(Handlebars.compile(commentTpl)([[_handleCommentData(isGitLab ? Object.assign(comment, {
        commitId: $item.attr('commit-id'),
        discussionId: $item.attr('discussion-id'),
    }) : comment, uid)]])).find('.note-item').prop('outerHTML')}
                                `);

                            $note.hide().insertBefore($replyWrapper.prev());
                            $note.fadeIn();
                            $loading.hide();
                            $replyWrapper.html('<div class="reply" title="Add a reply" data-action="reply">Reply...</div>');
                        });
                    }
                    console.log(url);
                    break;
                case 'cancelReply':
                    $replyWrapper.html('<div class="reply" title="Add a reply" data-action="reply">Reply...</div>');
                    break;
                case 'remove':
                    url = urls['comment']($noteItem.attr('comment-id'), $item.attr('commit-id'), $item.attr('discussion-id'));
                    if (url && window.confirm('Are you sure you want to delete this?')) {
                        $loading = _loading($content);
                        $.ajax({url: _url(url), type: 'DELETE'}).done(() => {
                            if ($item.find('.note-item:visible').length === 1) {
                                // empty note-item
                                $item.fadeOut();

                                if ($content.find('.comment-item:visible').length === 1) {
                                    // empty comment-item
                                    $item.replaceWith(Handlebars.compile(commentTpl)([]));
                                }
                            } else {
                                $noteItem.prev('.slider').length ? $noteItem.prev('.slider').fadeOut() : $noteItem.next('.slider').fadeOut();
                                $noteItem.fadeOut();
                            }

                            $loading.hide();
                        });
                    }
                    break;
                case 'send':
                    url = urls['leave.comment'](latestCommit);
                    if (url) {
                        $loading = _loading($editorWrapper.find('.editor'));
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
                        }).done(comment => {
                            const $emptyItem = $content.find('.empty-comments');
                            const $item = $(Handlebars.compile(commentTpl)([[_handleCommentData(isGitLab ? Object.assign(comment.notes[0], {
                                commitId: latestCommit.id,
                                discussionId: comment.id,
                            }) : comment, uid)]]));

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
        const deferred = $.Deferred();
        const _url = _wrapUrl(token);
        /** init users searching */
        const url = urls['users'];
        (!url ? $.Deferred().resolve([]) : _getRecursively(_url(url))).then(result => {
            users = result;
            $editorWrapper.show();

            /** init editor */
            const $editor = $editorWrapper.find('.editor');
            $editor.html(Handlebars.compile(editorTpl)({send: true}));
            const editor = _initEditor($editor.find('.editor textarea')[0]);

            /** init the avatar of authenticated user */
            $.get(_url(urls['oauth.user'])).done(({id, avatar_url: avatar}) => {
                $contentWrapper.find('.user-avatar').on('load', function () {
                    $(this).parent().css('display', 'inline-block');
                }).attr('src', avatar);

                _showComment(token, id, editor);
            }).fail(deferred.reject);
        }).fail(deferred.reject);
        return deferred.promise();
    };

    const _showAuth = () => {
        $authWrapper.show().find('.auth-btn').off('click').on('click', () => {
            location.href = urls['oauth.redirect']();
        });

        if (isGitLab) {
            $commentWrapper.hide();
        } else {
            _showComment(gitbook.state.config.pluginsConfig['comments-footer'].token || __ENV_ACCESS_TOKEN__);
        }
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
    if ((accessToken = hash['access_token'])) {
        /** update cookie */
        Cookie.set('comment.access_token', accessToken);
        _run(accessToken);
        /** scroll to content wrapper */
        location.href = `${hash['state'] ? decodeURIComponent(hash['state']) : location.href.replace(/#.*$/gi, '')}#comment-wrapper`;
    } else if ((accessToken = Cookie.get('comment.access_token'))) {
        _run(accessToken);
    } else {
        /** ask for authorizing */
        _showAuth();
    }
};

// noinspection JSUnresolvedVariable
gitbook.events.bind('page.change', entry);

/** helper */
function _stop(e) {
    e.preventDefault();
    e.stopPropagation();
}
