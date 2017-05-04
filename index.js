#!/usr/bin/env node
const fetch = require( 'node-fetch' );
const get = require( 'lodash.get' );
require( 'dotenv' ).config();
const chalk = require( 'chalk' );
const date = require( 'date-fns' );
const meow = require( 'meow' );
const inquirer = require( 'inquirer' );
const Conf = require( 'conf' );
const logUpdate = require( 'log-update' );

const config = new Conf();

let logMessages = false;

function log( message ) {
	logMessages && logUpdate( message );
}

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
	log( `😁  printing ${ notifications.length } notifications...` );
	logUpdate.done();
	if ( notifications.length < 1 ) {
		log( '👍  No notifications!' );
	}
	getFormattedNotifications( notifications ).map( output );
}

function getFetchInit() {
	return {
		method: 'GET',
		headers: {
			Authorization: 'token ' + getToken(),
		},
	};
}

function fetchNotifications() {
	if ( ! getToken() ) {
		return new Promise( ( resolve, reject ) => {
			printError( chalk.yellow( 'You do not have a GitHub token configured.' ) );
			printError( chalk.yellow( 'Please Generate one at https://github.com/settings/tokens' ) );
			printError( chalk.green( 'Once you have a token, run `gitnews --save-token`' ) );
			reject( 'GITNEWS_TOKEN was not set' );
		} );
	}
	log( 'fetching notifications...' );
	return fetch( 'https://api.github.com/notifications', getFetchInit() );
}

function fetchNotificationSubjectUrl( notification ) {
	const url = getUrlApiUrl( notification );
	log( `fetching notification url for ${ url }...` );
	return fetch( url, getFetchInit() )
		.then( convertToJson )
		.then( subject => {
			notification.htmlUrl = get( subject, 'html_url' );
			return notification;
		} );
}

function fetchNotificationSubjectUrls( notifications ) {
	log( `fetching notification urls for ${ notifications.length } notifications...` );
	return Promise.all( notifications.map( fetchNotificationSubjectUrl ) );
}

function printError( err ) {
	console.error( err );
}

function checkForErrors( result ) {
	return new Promise( ( resolve, reject ) => {
		if ( result.message ) {
			printError( chalk.red( 'An error occurred while trying to get your notifications:' ) );
			return reject( result.message );
		}
		resolve( result );
	} );
}

function fetchAndPrintNotifications() {
	fetchNotifications()
		.then( convertToJson )
		.then( checkForErrors )
		.then( fetchNotificationSubjectUrls )
		.then( printNotifications )
		.catch( printError );
}

function saveToken( token ) {
	config.set( 'token', token );
}

function getToken() {
	return process.env.GITNEWS_TOKEN || config.get( 'token' );
}

// -------------

const cli = meow( `
	Usage:
		$ gitnews

	Options:
		--save-token  Prompt for the token and save it.
		--verbose     Say what we're doing.
` );

if ( cli.flags.verbose ) {
	logMessages = true;
}

if ( cli.flags.saveToken ) {
	output( chalk.yellow( 'Please Generate a token at https://github.com/settings/tokens' ) );
	inquirer.prompt( { type: 'password', name: 'token', message: 'Enter the GitHub token:' } )
	// TODO: verify the token before saving
		.then( input => saveToken( input.token ) )
		.then( () => output( chalk.green( 'The token was saved! Now you can run gitnews to get your notifications.' ) ) );
} else {
	fetchAndPrintNotifications();
}
