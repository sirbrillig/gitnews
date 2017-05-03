#!/usr/bin/env node
const fetch = require( 'node-fetch' )
const get = require( 'lodash.get' )
require( 'dotenv' ).config()

function getFormattedNotification( notification ) {
	return notification.updated_at + ': ' + '(' + get( notification, 'repository.full_name' ) + ') ' + get( notification, 'subject.title' )
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
.then( function( notifications ) {
	notifications.map( getFormattedNotification ).map( output )
} )
