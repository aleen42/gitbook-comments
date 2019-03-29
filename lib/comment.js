/* global $, SYS_CONST, gitbook */

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

    const _showComment = () => {
        const $contentWrapper = $('.content-wrapper');
        $contentWrapper.show();
        $contentWrapper.find('.sign-out-btn').off('click').on('click', () => {
            /** remove cookie */
            Cookie.remove('comment.access_token');
            /** show authorization module */
            $contentWrapper.hide();
            _showAuth();
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
        _showComment();
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
