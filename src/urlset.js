/* global $, SYS_CONST */

const urls = {
    github: {
        'oauth.redirect': () => `https://gitbook-comments.aleen42.com/redirect?${$.param({
            redirect: location.href.replace(/#.*$/gi, ''),
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
        'oauth.redirect': () => `${SYS_CONST.host}/oauth/authorize?${$.param({
            client_id: SYS_CONST.clientId,
            redirect_uri: SYS_CONST.redirect,
            response_type: 'token',
            state: location.href.replace(/#.*$/gi, ''),
        })}`,
        'oauth.user': `${SYS_CONST.host}/api/v4/user`,
        'files.commits': `${SYS_CONST.host}/api/v4/projects/${encodeURIComponent(SYS_CONST.repo)}/repository/commits`,
        'commit.diff': ({id}) => `${SYS_CONST.host}/api/v4/projects/${encodeURIComponent(SYS_CONST.repo)}/repository/commits/${id}/diff`,
        'commit.comments': ({id}) => `${SYS_CONST.host}/api/v4/projects/${encodeURIComponent(SYS_CONST.repo)}/repository/commits/${id}/discussions`,
        'leave.comment': ({id}) => `${SYS_CONST.host}/api/v4/projects/${encodeURIComponent(SYS_CONST.repo)}/repository/commits/${id}/discussions`,
        'comment': (id, commitId, discussionId) => `${SYS_CONST.host}/api/v4/projects/${encodeURIComponent(SYS_CONST.repo)}/repository/commits/${commitId}/discussions/${discussionId}${id ? `/notes/${id}` : '/notes'}`,
        'users': `${SYS_CONST.host}/api/v4/users`,
    },
};

module.exports = {
    of: type => urls[type] || {},
};
