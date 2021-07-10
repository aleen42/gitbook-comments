## gitbook-comments

A project focusing on comments integrated with code management providers like GitLab or GitHub.

![npm](https://aleen42.github.io/badges/src/npm.svg) ![javascript](https://aleen42.github.io/badges/src/javascript.svg) ![gitbook](https://aleen42.github.io/badges/src/gitbook_1.svg) ![gitbook](https://aleen42.github.io/badges/src/gitbook_2.svg)

![](https://img.shields.io/badge/%20%20JavaScript-%20%20%20%2041,538L-f1e05a.svg) ![](https://img.shields.io/badge/%20%20CSS-%20%20%20%20961L-563d7c.svg) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/aleen42/gitbook-comments/master/LICENSE) [![npm](https://img.shields.io/npm/dt/gitbook-plugin-comments-footer.svg)](https://www.npmjs.com/package/gitbook-plugin-comments-footer)

![comments-footer](./preview.png)

### Installation

Add the following plugins to your `book.json` and run the command `gitbook install`

```json
{
	"plugins": ["comments-footer"]
}
```

### Usage

#### 1. GitHub

To use this plugin in a GitBook project deployed on GitHub, the first step is to install [the GitHub app](https://github.com/apps/aleen42-gitbook-comments) in your repository for accessing.

And then, the configuration option can be set as an object like the following snippet:

```json
{
	"plugins": [
		"comments-footer"
	],
	"pluginsConfig": {
		"comments-footer": {
			"type": "github",
			"repo": "aleen42/PersonalWiki",
			"copyright": "Copyright © aleen42"
		}
	}
}
```

#### 2. GitLab

What if using it in GitLab? You may need to create an application yourself with `API` scope accessing.

![gitbook-comments](./gitlab_application.png)

- **Name**: any name you want
- **Redirect URI**: the page url you published
- **Scopes**: choose `api`

And then, the configuration option can be set as an object like the following snippet:

```json
{
	"plugins": [
		"comments-footer"
	],
	"pluginsConfig": {
		"comments-footer": {
			"type": "gitlab",
			"repo": "fe-components/fe-documents",
			"copyright": "Copyright © aleen42",
			"redirect": "xxx",
			"clientId": "xxx",
			"host": "http://git.xxx.cn/"
		}
	}
}
```

- **redirect**: the page url you published
- **clientId**: the Application ID of your application created above
- **host**: the GitLab server host

### TODO

- [ ] Disable subscribing states when commenting on articles.
- [ ] Heroku is UNSTABLE for GitHub authorization!
- [x] Replying features on GitLab.
- [x] ~~GitLab features depend on the functions around commit comments: https://gitlab.com/gitlab-org/gitlab-ce/issues/59798.~~ Use discussion instead.
- [x] ~~GitLab private access token has no detailed scope for avoiding abusing by others.~~ It means that I cannot get discussions when users do not authorize themselves.

### Release History

* ==================== **1.0.0 Initial release** ====================
    * 1.1.2 oauth2 integration
	* 1.1.3 initial structure for featuring GitHub
	* 1.1.4 fix bug
	* 1.1.5 enhancement for reducing authorizing redirecting
	* 1.1.6 enhancement of compatible styles
	* 1.1.9 styles for the authorization wrapper and unexpected redirect url
	* 1.2.0 support GitLab
	* 1.2.2 fix commented time and passed parameters when leaving comments in GitLab
	* 1.2.3 show user link anchor
	* 1.2.5 bug fix and show site link after leaving comments
	* 1.2.7 list all commits recursively
	* 1.2.9 bug fix
	* 1.3.0 more restrict regression for matching commit difference
	* 1.3.1 support replying features in GitLab
	* 1.3.2 redirect to visited site after authorized in GitLab
	* 1.3.3 fix NPE problem
	* 1.3.5 autocomplete feature within GitLab and fix a bug
	* 1.3.7 unified font sizes
	* 1.3.8 compatible autocomplete for GitHub
	* 1.3.9 feature autocomplete for GitHub
	* 1.4.2 deprecated token access way for GitHub
	* 1.4.3 keep token in url queries for GitLab
    * 1.4.5 audit vulnerable dependencies
    * 1.4.7 avoid downloading font-awesome via using SimpleMDE
    * 1.4.9 avoid exposing token via Heroku
    * 1.5.2 use gitbook-color to support light or dark theme

### Q&A

1. Why does requests towards GitLab API fails the policy of CORS? [#4](https://github.com/aleen42/gitbook-comments/issues/4)

    > I have tested under **CE 11.7.5** and GitLab has already set `Access-Control-Allow-Origin: *` for all requests of `api/*` under a `GET` way by default. If not for your environment, try to find a way to configure it.

### :fuelpump: How to contribute

Have an idea? Found a bug? See [how to contribute](https://aleen42.github.io/PersonalWiki/contribution.html).

### :scroll: License

[MIT](https://aleen42.github.io/PersonalWiki/MIT.html) © aleen42
