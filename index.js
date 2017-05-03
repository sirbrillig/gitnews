#!/usr/bin/env node
const fetch = require( 'node-fetch' );
const get = require( 'lodash.get' );
require( 'dotenv' ).config();
const chalk = require( 'chalk' );
const date = require( 'date-fns' );
const debugFactory = require( 'debug' );

const debug = debugFactory( 'gitnews' );

function getUrl( notification ) {
	return get( notification, 'htmlUrl', '' );
}

function getUrlApiUrl( notification ) {
	return get( notification, 'subject.url', '' );
}

function getDate( notification ) {
	const now = Date.now();
	return date.distanceInWords(
		now,
		date.parse( get( notification, 'updated_at', '' ) ),
		{ addSuffix: true }
	);
}

function getRepo( notification ) {
	return get( notification, 'repository.full_name', '' );
}

function getTitle( notification ) {
	return get( notification, 'subject.title', '' );
}

function getFormattedNotification( note ) {
	debug( `formatting notification for ${ JSON.stringify( note.id ) }...` );
	return [
		chalk.bold.yellow( getDate( note ) + ': ' ),
		chalk.green( '(' + getRepo( note ) + ') ' ),
		getTitle( note ),
		' -- ' + getUrl( note ),
	].join( '' );
}

function output( line ) {
	console.log( line );
}

function convertToJson( result ) {
	return result.json();
}

function getFormattedNotifications( notifications ) {
	return notifications.map( getFormattedNotification );
}

function printNotifications( notifications ) {
	debug( 'printing notifications...' );
	getFormattedNotifications( notifications ).map( output );
}

function getAPIToken() {
	return process.env.GITNEWS_TOKEN;
}

function getFetchInit() {
	return {
		method: 'GET',
		headers: {
			Authorization: 'token ' + getAPIToken(),
		},
	};
}

function fetchNotifications() {
	if ( ! getAPIToken() ) {
		return new Promise( ( resolve, reject ) => {
			reject( 'GITNEWS_TOKEN was not set' );
		} );
	}
	debug( 'fetching notifications...' );
	return fetch( 'https://api.github.com/notifications', getFetchInit() );
}

function fetchNotificationSubjectUrl( notification ) {
	const url = getUrlApiUrl( notification );
	debug( `fetching notification url for ${ url }...` );
	return fetch( url, getFetchInit() )
		.then( convertToJson )
		.then( subject => {
			notification.htmlUrl = get( subject, 'html_url' );
			return notification;
		} );
}

function fetchNotificationSubjectUrls( notifications ) {
	debug( `fetching notification urls for ${ notifications.length } notifications...` );
	return Promise.all( notifications.map( fetchNotificationSubjectUrl ) );
}

function printError( err ) {
	console.error( err );
}

// -------------

fetchNotifications()
	.then( convertToJson )
	.then( fetchNotificationSubjectUrls )
	.then( printNotifications )
	.catch( printError );

