const nodeFetch = require( 'node-fetch' );
const { fetchNotifications, getAdditionalDataFetcher } = require( './lib/fetchers' );
const { makeConverter } = require( './lib/converter' );

function createNoteGetter( options = {} ) {
	const defaultOptions = {
		fetch: nodeFetch,
		log: () => {},
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
