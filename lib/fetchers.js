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

function fetchNotifications( getter, token, params = {} ) {
	if ( ! token ) {
		const err = new Error( 'GitHub token is not available' );
		err.code = 'GitHubTokenNotFound';
		return Promise.reject( err );
	}
	getter.log( 'fetching notifications...' );
	return getter.fetch( withQuery( 'https://api.github.com/notifications', params ), getFetchInit( token ) )
		.then( checkForHttpErrors )
		.then( convertToJson )
		.then( checkForErrors )
		.then( checkForArray );
}

function fetchNotificationSubjectUrl( getter, token, note ) {
	const url = get( note, 'api.notification.subject.url', '' );
	getter.log( `fetching subject data for ${ url }` );
	return getter.fetch( url, getFetchInit( token ) )
		.then( checkForHttpErrors )
		.then( convertToJson )
		.then( checkForErrors )
		.then( subject => {
			note.api.subject = subject;
			note.subjectUrl = get( subject, 'html_url' );
			return note;
		} );
}

function fetchNotificationCommentData( getter, token, note ) {
	const subject = get( note, 'api.notification.subject', {} );
	const url = subject.latest_comment_url || subject.url || '';
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
