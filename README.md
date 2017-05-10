# gitnews

A node module to fetch GitHub notifications.

Made to be used by [gitnews-cli](https://github.com/sirbrillig/gitnews-cli).

# Usage

You must first create GitHub token. To create the token, visit the [Tokens](https://github.com/settings/tokens) page and generate a new token for the app. You can call it "gitnews" and it needs at least `notifications` scope and the `repo` scope.

Then import the `getNotifications` named function and pass it the token.

```js
const { getNotifications } = require( 'gitnews' );
getNotifications( token )
	.then( notes => notes.map( showNotification ) );

function showNotification( note ) {
	console.log( note.repository.full_name + ': ' + note.subject.title + ' -- ' + note.html_url ); 
}
```

The function will return a Promise. When the Promise resolves, it will pass the callback an array of notification objects. Each notification object has several properties, of which the most relevant are those listed below:

- `repository.full_name`: The full Repository name (eg: `sirbrillig/gitnews`).
- `subject.title`: The title of the notification.
- `html_url`: The URL of the notification.
