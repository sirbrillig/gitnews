# gitnews

A simple node module to fetch GitHub notifications.

Made to be used by [gitnews-cli](https://github.com/sirbrillig/gitnews-cli) and [gitnews-menubar](https://github.com/sirbrillig/gitnews-menubar).

Since this module uses a custom token, it can report on private repositories as well as public ones.

## Install

Using npm:

```
npm i --save gitnews
```

Using yarn:

```
yarn add gitnews
```

## Usage

You must first create a GitHub token so the module has access to your notifications. To create the token, visit the [Tokens](https://github.com/settings/tokens) page and generate a new token for the app. You can call it "gitnews" and it needs at least `notifications` scope and the `repo` scope.

Then import the `getNotifications` named function and pass it the token.

```js
const { getNotifications } = require( 'gitnews' );
getNotifications( token )
	.then( notes => notes.filter( note => note.unread ) )
	.then( notes => notes.map( showNotification ) );

function showNotification( note ) {
	console.log( note.repositoryFullName + ': ' + note.title + ' -- ' + note.subjectUrl );
}
```

The function will return a Promise. When the Promise resolves, it will pass the callback an array of notification objects. Each notification object has the properties listed below:

- `updatedAt`: The time (in ISO 8601 format) of the notification.
- `unread`: True if the notification has not been seen.
- `repositoryName`: The Repository name (eg: `gitnews`).
- `repositoryFullName`: The full Repository name (eg: `sirbrillig/gitnews`).
- `title`: The title of the notification.
- `type`: The type of the notification.
- `id`: A unique ID for this notification (at its most recently updated timestamp).
- `private`: True if the notification repo is private.
- `commentUrl`: The URL of the notification's most recent comment.
- `subjectUrl`: The URL of the notification's issue or PR.
- `commentAvatar`: The URL of the image for the notification's most recent commenter.
- `repositoryOwnerAvatar`: The URL of the image for the Repository's owner.

If you need additional data, the actual GitHub API responses are stored under the `api` property.

## Advanced Usage

The `getNotifications` function is actually created by a factory function called `createNoteGetter` which is also exported by the module. `createNoteGetter` accepts an object with the following optional properties:

- `log`: Defines a logging function which will be called with status messages as the fetching process proceeds. This defaults to a noop.
- `fetch`: Defines the `fetch` function to use when making API requests. This defaults to [`node-fetch`](https://www.npmjs.com/package/node-fetch). This is mostly useful for testing.

For example:

```js
const { createNoteGetter } = require( 'gitnews' );
const getNotifications = createNoteGetter( { log: message => console.log( message ) } );
getNotifications( token );
```

## Marking Notifications Read

The main purpose of this module is to retreieve notification URLs. Once a notification URL is visited, it typically marks the notification as read. In some cases (eg: security warnings), that does not happen. In these cases, it might be useful to manually mark a notification as read. This module exports the `markNotificationRead` function which can be used to do this.

The `markNotificationRead` function requires two arguments:

- The token.
- The notification object that resulted from calling getNotifications.

The following example marks all notifications as read.

```js
const { getNotifications, markNotificationRead } = require( 'gitnews' );
getNotifications( token )
	.then( notes => notes.filter( note => note.unread ) )
	.then( notes => notes.map( note => markNotificationRead( token, note ) ) );
```

Just like `getNotifications`, `markNotificationRead` is created by a factory function called `createNoteMarkRead`. This can be used to override the `log` and `fetch` functions.

```js
const { createNoteMarkRead } = require( 'gitnews' );
const markNotificationRead = createNoteMarkRead( { log: message => console.log( message ) } );
markNotificationRead( token, note );
```
