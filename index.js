const nodeFetch = require( 'node-fetch' );
const md5Hex = require( 'md5-hex' );
const get = require( 'lodash.get' );
const { fetchNotifications, getAdditionalDataFetcher } = require( './lib/fetchers' );

// Used to make sure invalid api responses still have a unique ID
let uniqueIndex = Date.now();

function convertToGitnews( notifications ) {
	return notifications.map( apiData => {
		if ( ! apiData ) {
			apiData = {};
		}
		uniqueIndex += Date.now();
		return {
			api: {
				notification: apiData,
				subject: null, // will be filled-in later
				comment: null, // will be filled-in later
			},
			id: md5Hex( get( apiData, 'id', uniqueIndex ) + get( apiData, 'updated_at', '1' ) ),
			unread: apiData.unread,
			title: get( apiData, 'subject.title' ),
			type: get( apiData, 'subject.type' ),
			updatedAt: apiData.updated_at,
			'private': apiData.private,
			repositoryName: get( apiData, 'repository.name' ),
			repositoryFullName: get( apiData, 'repository.full_name' ),
			repositoryOwnerAvatar: get( apiData, 'repository.owner.avatar_url' ),
			subjectUrl: null, // will be filled-in later
			commentUrl: null, // will be filled-in later
			commentAvatar: null, // will be filled-in later
		};
	} );
}

// -------------

function makeNotificationGetter( options = {} ) {
	const defaultOptions = {
		fetch: nodeFetch,
		log: () => {},
	};
	const getterOptions = Object.assign( {}, defaultOptions, options );
	return function getNotifications( token, params = {} ) {
		const fetchAdditionalData = getAdditionalDataFetcher( getterOptions, token );
		return fetchNotifications( getterOptions, token, Object.assign( { all: true }, params ) )
			.then( convertToGitnews )
			.then( fetchAdditionalData );
	};
}

module.exports = {
	makeNotificationGetter,
};
