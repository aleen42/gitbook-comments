## gitbook-comments

A project focusing on comments integrated with code management providers like GitLab or GitHub.

![gitbook](https://aleen42.github.io/badges/src/gitbook_1.svg) ![gitbook](https://aleen42.github.io/badges/src/gitbook_2.svg) [![GitHub issues](https://img.shields.io/github/issues/aleen42/gitbook-comments.svg)](https://github.com/aleen42/gitbook-comments/issues) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/aleen42/gitbook-comments/master/LICENSE)

[![npm](https://img.shields.io/npm/v/gitbook-plugin-comments-footer.svg)](https://www.npmjs.com/package/gitbook-plugin-comments-footer) [![devDependency Status](https://david-dm.org/aleen42/gitbook-comments/dev-status.svg)](https://david-dm.org/aleen42/gitbook-comments#info=devDependencies) [![npm](https://img.shields.io/npm/dt/gitbook-plugin-comments-footer.svg)](https://www.npmjs.com/package/gitbook-plugin-comments-footer)

![comments-footer](./preview.png)

### Installation

Add the following plugins to your `book.json` and run the command `gitbook install`

```json
{
    "plugins": ["comments-footer"]
}
```

### Usage

Install [the GitHub app](https://github.com/apps/aleen42-gitbook-comments) in your repository for accessing comments firstly.

Configuration options can be set as an object like the following snippet:

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

### TODO

- [ ] Disable subscribing states when commenting on articles.
- [ ] GitLab features depend on the functions around commit comments: https://gitlab.com/gitlab-org/gitlab-ce/issues/59798.

### Release History

* ==================== **1.0.0 Initial release** ====================
	* 1.1.2 oauth2 integration
	* 1.1.3 initial structure for featuring GitHub
	* 1.1.4 fix bug
	* 1.1.5 enhancement for reducing authorizing redirecting
	* 1.1.6 enhancement of compatible styles

### :fuelpump: How to contribute

Have an idea? Found a bug? See [how to contribute](https://aleen42.github.io/PersonalWiki/contribution.html).

### :scroll: License

[MIT](https://aleen42.github.io/PersonalWiki/MIT.html) © aleen42
