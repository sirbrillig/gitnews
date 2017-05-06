# gitnews

A node module to fetch GitHub notifications.

Made to be used by [gitnews-cli](https://github.com/sirbrillig/gitnews-cli).

# Usage

You must first set the environment variable `GITNEWS_TOKEN` to a GitHub token. To create the token, visit the [Tokens](https://github.com/settings/tokens) page and generate a new token for the app. You can call it "gitnews" and it needs at least `notifications` scope.

Then import the `getNotifications` function and pass it the token.

```js
const { getNotifications, setLogger } = require( 'gitnews' );
getNotifications( token )
	.then( note => console.log( note.repository.full_name + ': ' + note.title + ' -- ' + note.html_url ) );
```
