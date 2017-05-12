const fetch = require( 'node-fetch' );
const get = require( 'lodash.get' );
const withQuery = require( 'with-query' );

let logFunction = () => null;

function log( message ) {
	logFunction( message );
}

function getUrlApiUrl( notification ) {
	return get( notification, 'subject.url', '' );
}

function convertToJson( result ) {
	return result.json();
}

function getFetchInit( token ) {
	return {
		method: 'GET',
		headers: {
			Authorization: 'token ' + token,
		},
	};
}

function fetchNotifications( token, params = {} ) {
	if ( ! token ) {
		return new Promise( ( resolve, reject ) => {
			reject( 'GitHub token is not available' );
		} );
	}
	log( 'fetching notifications...' );
	return fetch( withQuery( 'https://api.github.com/notifications', params ), getFetchInit( token ) );
}

function fetchNotificationSubjectUrl( token, notification ) {
	const url = getUrlApiUrl( notification );
	log( `fetching notification url for ${ url }...` );
	return fetch( url, getFetchInit( token ) )
		.then( convertToJson )
		.then( subject => {
			notification.html_url = get( subject, 'html_url' ); // eslint-disable-line camelcase
			return notification;
		} );
}

function fetchNotificationSubjectUrls( token, notifications ) {
	log( `fetching notification urls for ${ notifications.length } notifications...` );
	return Promise.all( notifications.map( notification => fetchNotificationSubjectUrl( token, notification ) ) );
}

function checkForErrors( result ) {
	return new Promise( ( resolve, reject ) => {
		if ( result.message ) {
			return reject( result.message );
		}
		resolve( result );
	} );
}

// -------------

function getNotifications( token, params = {} ) {
	return fetchNotifications( token, params )
		.then( convertToJson )
		.then( checkForErrors )
		.then( notifications => fetchNotificationSubjectUrls( token, notifications ) );
}

function getReadNotifications( token, params = {} ) {
	return fetchNotifications( token, Object.assign( params, { all: true } ) )
		.then( convertToJson )
		.then( checkForErrors )
		.then( notifications => notifications.filter( note => ! note.unread ) )
		.then( notifications => fetchNotificationSubjectUrls( token, notifications ) );
}

function setLogger( logger ) {
	logFunction = logger;
}

module.exports = {
	setLogger,
	getNotifications,
	getReadNotifications,
};
