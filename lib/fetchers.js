const get = require( 'lodash.get' );
const { Response } = require( 'node-fetch' );
const withQuery = require( 'with-query' );

function getFetchInit( token ) {
	return {
		method: 'GET',
		headers: {
			Authorization: 'token ' + token,
		},
	};
}

function convertToJson( result ) {
	return result.json();
}

/**
 * Return a Promise of notifications
 *
 * Requires `getter` to have the following properties:
 * - log Function A function that logs status output
 * - getCachedResponseFor Function A function that returns a cached response for a URL
 * - cacheResponseFor Function A function that caches a response for a URL
 * - fetch Function A function that implements the HTTP fetch API
 * - notificationsUrl String the GitHub API notifications URL
 *
 * @param {Object} getter See above
 * @param {String} token The API token to send to the getter
 * @param {Object} params params object to include in the fetch URL
 * @return {Promise} An array of notifications
 */
function fetchNotifications( getter, token, params = {} ) {
	if ( ! token ) {
		const err = new Error( 'GitHub token is not available' );
		err.code = 'GitHubTokenNotFound';
		return Promise.reject( err );
	}
	getter.log( 'fetching notifications...' );
	const url = withQuery( getter.notificationsUrl, params );
	const cachedResponse = getter.getCachedResponseFor( url );
	if ( cachedResponse ) {
		return Promise.resolve( cachedResponse );
	}
	return getter.fetch( url, getFetchInit( token ) )
		.then( checkForHttpErrors )
		.then( convertToJson )
		.then( checkForErrors )
		.then( checkForArray )
		.then( response => {
			getter.cacheResponseFor( url, response );
			return response;
		} );
}

function fetchNotificationSubjectUrl( getter, token, note ) {
	const url = get( note, 'api.notification.subject.url', '' );
	const cachedResponse = getter.getCachedResponseFor( url );
	if ( cachedResponse ) {
		return Promise.resolve( cachedResponse );
	}
	getter.log( `fetching subject data for ${ url }` );
	return getter.fetch( url, getFetchInit( token ) )
		.then( checkForHttpErrors )
		.then( convertToJson )
		.then( checkForErrors )
		.then( subject => {
			note.api.subject = subject;
			note.subjectUrl = get( subject, 'html_url' );
			return note;
		} )
		.then( response => {
			getter.cacheResponseFor( url, response );
			return response;
		} );
}

function fetchNotificationCommentData( getter, token, note ) {
	const subject = get( note, 'api.notification.subject', {} );
	const url = subject.latest_comment_url || subject.url || '';
	const cachedResponse = getter.getCachedResponseFor( url );
	if ( cachedResponse ) {
		return Promise.resolve( cachedResponse );
	}
	getter.log( `fetching comment data for ${ url }` );
	return getter.fetch( url, getFetchInit( token ) )
		.then( checkForHttpErrors )
		.catch( getAllowMissingResource( getter, subject.url || '', token ) )
		.then( convertToJson )
		.then( checkForErrors )
		.then( comment => {
			note.api.comment = comment;
			note.commentUrl = get( comment, 'html_url' );
			note.commentAvatar = get( comment, 'user.avatar_url' );
			return note;
		} )
		.then( response => {
			getter.cacheResponseFor( url, response );
			return response;
		} );
}

function getAllowMissingResource( getter, replacementUrl, token ) {
	return function allowMissingResource( response ) {
		if ( response.status === 404 ) {
			return getter.fetch( replacementUrl, getFetchInit( token ) );
		}
		return Promise.reject( response );
	};
}

function checkForHttpErrors( response ) {
	if ( ! response.ok ) {
		return Promise.reject( response );
	}
	return response;
}

function checkForArray( result ) {
	if ( ! result.map ) {
		return Promise.reject( new Error( 'Notifications list is not an array.' ) );
	}
	return Promise.resolve( result );
}

function checkForErrors( result ) {
	return new Promise( ( resolve, reject ) => {
		if ( result.message ) {
			return reject( new Error( result.message ) );
		}
		resolve( result );
	} );
}

function fetchNoteData( getter, token, note ) {
	return fetchNotificationSubjectUrl( getter, token, note )
		.then( updatedNote => fetchNotificationCommentData( getter, token, updatedNote ) );
}

function getAdditionalDataFetcher( getter, token ) {
	return notes => {
		return Promise.all( notes.map( note => fetchNoteData( getter, token, note ) ) );
	};
}

module.exports = {
	fetchNotifications,
	getAdditionalDataFetcher,
};
