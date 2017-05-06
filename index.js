const fetch = require( 'node-fetch' );
const get = require( 'lodash.get' );

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

function fetchNotifications( token ) {
	if ( ! token ) {
		return new Promise( ( resolve, reject ) => {
			reject( 'GitHub token is not available' );
		} );
	}
	log( 'fetching notifications...' );
	return fetch( 'https://api.github.com/notifications', getFetchInit( token ) );
}

function fetchNotificationSubjectUrl( token, notification ) {
	const url = getUrlApiUrl( notification );
	log( `fetching notification url for ${ url }...` );
	return fetch( url, getFetchInit( token ) )
		.then( convertToJson )
		.then( subject => {
			notification.htmlUrl = get( subject, 'html_url' );
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

function getNotifications( token ) {
	return fetchNotifications( token )
		.then( convertToJson )
		.then( checkForErrors )
	// TODO: curry the fetch methods
		.then( notifications => fetchNotificationSubjectUrls( token, notifications ) );
}

function setLogger( logger ) {
	logFunction = logger;
}

module.exports = {
	setLogger,
	getNotifications,
};
