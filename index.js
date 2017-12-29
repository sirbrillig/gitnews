const nodeFetch = require( 'node-fetch' );
const getCacheHandler = require( './lib/cache-handler' );
const { fetchNotifications, getAdditionalDataFetcher } = require( './lib/fetchers' );
const { makeConverter } = require( './lib/converter' );
const noop = () => {};

function createNoteGetter( options = {} ) {
	const cacheHandler = getCacheHandler();
	const defaultOptions = {
		getCachedResponseFor: cacheHandler.getCachedResponseFor,
		cacheResponseFor: cacheHandler.cacheResponseFor,
		fetch: nodeFetch,
		log: noop,
		notificationsUrl: 'https://api.github.com/notifications',
	};
	const getterOptions = Object.assign( {}, defaultOptions, options );
	const convertToGitnews = makeConverter();
	return function getNotifications( token, params = {} ) {
		const fetchAdditionalData = getAdditionalDataFetcher( getterOptions, token );
		return fetchNotifications( getterOptions, token, Object.assign( { all: true }, params ) )
			.then( convertToGitnews )
			.then( fetchAdditionalData );
	};
}

module.exports = {
	createNoteGetter,
	getNotifications: createNoteGetter(),
};
