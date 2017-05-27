const fetch = require( 'node-fetch' );
const get = require( 'lodash.get' );
const withQuery = require( 'with-query' );
const { log } = require( './logger' );

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

function fetchNotifications( token, params = {} ) {
	if ( ! token ) {
		return new Promise( ( resolve, reject ) => {
			const err = new Error( 'GitHub token is not available' );
			err.code = 'GitHubTokenNotFound';
			reject( err );
		} );
	}
	log( 'fetching notifications...' );
	return fetch( withQuery( 'https://api.github.com/notifications', params ), getFetchInit( token ) )
		.then( convertToJson )
		.then( checkForErrors );
}

function fetchNotificationSubjectUrl( token, note ) {
	const url = note.api.notification.subject.url;
	log( `fetching subject data for ${ url }` );
	return fetch( url, getFetchInit( token ) )
		.then( convertToJson )
		.then( checkForErrors )
		.then( subject => {
			note.api.subject = subject;
			note.subjectUrl = get( subject, 'html_url' );
			return note;
		} );
}

function fetchNotificationCommentData( token, note ) {
	const url = note.api.notification.subject.latest_comment_url || note.api.notification.subject.url;
	log( `fetching comment data for ${ url }` );
	return fetch( url, getFetchInit( token ) )
		.then( convertToJson )
		.then( checkForErrors )
		.then( comment => {
			note.api.comment = comment;
			note.commentUrl = get( comment, 'html_url' );
			note.commentAvatar = get( comment, 'user.avatar_url' );
			return note;
		} );
}

function checkForErrors( result ) {
	return new Promise( ( resolve, reject ) => {
		if ( result.message ) {
			return reject( result.message );
		}
		resolve( result );
	} );
}

function fetchNoteData( token, note ) {
	return fetchNotificationSubjectUrl( token, note )
		.then( updatedNote => fetchNotificationCommentData( token, updatedNote ) );
}

function getAdditionalDataFetcher( token ) {
	return notes => {
		return Promise.all( notes.map( note => fetchNoteData( token, note ) ) );
	};
}

module.exports = {
	fetchNotifications,
	getAdditionalDataFetcher,
};