# gitnews

A simple node module to fetch GitHub notifications.

Made to be used by [gitnews-cli](https://github.com/sirbrillig/gitnews-cli) and [gitnews-menubar](https://github.com/sirbrillig/gitnews-menubar).

Since this module uses a custom token, it can report on private repositories as well as public ones.

# Install

Using npm:

```
npm i --save gitnews
```

Using yarn:

```
yarn add gitnews
```

# Usage

You must first create a GitHub token so the module has access to your notifications. To create the token, visit the [Tokens](https://github.com/settings/tokens) page and generate a new token for the app. You can call it "gitnews" and it needs at least `notifications` scope and the `repo` scope.

Then import the `getNotifications` named function and pass it the token. (There is also a `getReadNotifications` function to return already-read notifications.)

```js
const { getNotifications } = require( 'gitnews' );
getNotifications( token )
	.then( notes => notes.map( showNotification ) );

function showNotification( note ) {
	console.log( note.repository.full_name + ': ' + note.subject.title + ' -- ' + note.html_url );
}
```

The function will return a Promise. When the Promise resolves, it will pass the callback an array of notification objects. Each notification object has several properties, of which the most relevant are those listed below:

- `updated_at`: The time (in ISO 8601 format) of the notification.
- `unread`: True if the notification has not been seen.
- `repository.name`: The Repository name (eg: `gitnews`).
- `repository.full_name`: The full Repository name (eg: `sirbrillig/gitnews`).
- `subject.title`: The title of the notification.
- `html_url`: The URL of the notification.
