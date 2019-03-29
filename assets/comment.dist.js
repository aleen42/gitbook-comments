'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/* global $, SYS_CONST, gitbook */

var Cookie = {
    set: function set(key, value) /* millisecond */{
        var expiration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

        var _expires = function _expires() {
            var date = new Date();
            expiration && date.setTime(date.getTime() + expiration);

            return expiration ? ['expires=' + date.toUTCString()] : [];
        };

        document.cookie = [key + '=' + value].concat(_toConsumableArray(_expires()), ['path=/']).join(';');
    },
    get: function get(key) {
        return document.cookie.split('; ').reduce(function (cookie, value) {
            var parts = value.split('=');
            return parts[0] === key ? decodeURIComponent(parts[1]) : cookie;
        }, '');
    },
    remove: function remove(key) {
        document.cookie = [key + '=', 'expires=Thu, 01 Jan 1970 00:00:00 GMT', 'path=/'].join(';');
    }
};

var entry = function entry() {
    var _showAuth = function _showAuth() {
        var $authWrapper = $('.auth-wrapper');

        $authWrapper.show();
        $authWrapper.find('.auth-btn').off('click').on('click', function () {
            // noinspection JSUnresolvedFunction
            location.href = SYS_CONST.host + '/oauth/authorize?' + $.param({
                client_id: SYS_CONST.clientId,
                redirect_uri: SYS_CONST.redirect,
                response_type: 'token'
            });
        });
    };

    var _showComment = function _showComment() {
        var $contentWrapper = $('.content-wrapper');
        $contentWrapper.show();
        $contentWrapper.find('.sign-out-btn').off('click').on('click', function () {
            /** remove cookie */
            Cookie.remove('comment.access_token');
            /** show authorization module */
            $contentWrapper.hide();
            _showAuth();
        });
    };

    /** extract access token and redirect */
    var hash = location.hash.substr(1).split('&').map(function (item) {
        return item.split('=');
    }).reduce(function (obj, item) {
        item[0] && (obj[item[0]] = item[1]);
        return obj;
    }, {});

    var accessToken = void 0;
    if (accessToken = hash['access_token'] || Cookie.get('comment.access_token')) {
        /** todo: check expiration of access token */
        /** update cookie */
        Cookie.set('comment.access_token', accessToken);
        _showComment();
    } else {
        /** ask for authorizing */
        _showAuth();
    }

    /** redirect to reading page */
    hash['access_token'] ? location.href = sessionStorage.getItem('comment.auth_redirect') + '#comment-wrapper' : sessionStorage.setItem('comment.auth_redirect', location.href.replace(/#.*$/gi, ''));
};

// noinspection JSUnresolvedVariable
gitbook.events.bind('page.change', entry);
