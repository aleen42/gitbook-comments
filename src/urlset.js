/* global $, SYS_CONST */

const urls = {
    github: {
        'oauth.redirect': `https://gitbook-comments.herokuapp.com/gitbook-comments/redirect?${$.param({
            redirect: SYS_CONST.redirect,
            authorized: `${SYS_CONST.host}/login/oauth/authorize`,
        })}`,
        'oauth.user': 'https://api.github.com/user',
        'files.commits': `https://api.github.com/repos/${SYS_CONST.repo}/commits`,
        'repo.comments': `https://api.github.com/repos/${SYS_CONST.repo}/comments`,
        'leave.comment': commit => `https://api.github.com/repos/${SYS_CONST.repo}/commits/${commit['sha']}/comments`,
        'comment': id => `https://api.github.com/repos/${SYS_CONST.repo}/comments/${id}`,
    },
    gitlab: {
        /** gitlab can use implicit grant flow to simplify the process */
        'oauth.redirect': `${SYS_CONST.host}/oauth/authorize?${$.param({
            client_id: SYS_CONST.clientId,
            redirect_uri: SYS_CONST.redirect,
            response_type: 'token',
        })}`,
        'files.commits': `${SYS_CONST.host}/api/v4/projects/${encodeURIComponent(SYS_CONST.repo)}/repository/commits`,
        'commit.comments': ({short_id}) => `${SYS_CONST.host}/api/v4/projects/${encodeURIComponent(SYS_CONST.repo)}/repository/commits/${short_id}/comments`,
        'leave.comment': commit => '',
        'comment': () => '',
    },
};

module.exports = {
    of: type => urls[type] || {},
};
