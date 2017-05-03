#!/usr/bin/env node
const fetch = require( 'node-fetch' )
const get = require( 'lodash.get' )
require( 'dotenv' ).config()
const chalk = require( 'chalk' )
const date = require( 'date-fns' )

function getDate( notification ) {
	const now = Date.now()
	return date.distanceInWords( now, date.parse( get( notification, 'updated_at', '' ) ), { addSuffix: true } )
}

function getRepo( notification ) {
	return get( notification, 'repository.full_name', '' )
}

function getTitle( notification ) {
	return get( notification, 'subject.title', '' )
}

function getFormattedNotification( note ) {
	return chalk.bold.yellow( getDate( note ) + ': ' ) + chalk.green( '(' + getRepo( note ) + ') ' ) + getTitle( note )
}

function output( line ) {
	console.log( line )
}

const init = {
	method: 'GET',
	headers: {
		'Authorization': 'token ' + process.env.GITNEWS_TOKEN,
	},
}
fetch( 'https://api.github.com/notifications', init )
.then( res => res.json() )
.then( notifications => notifications.map( getFormattedNotification ).map( output ) )
