const getProxyFetch = require( './lib/proxy-fetch' );
const { fetchNotifications, getAdditionalDataFetcher } = require( './lib/fetchers' );
const { makeConverter } = require( './lib/converter' );
const noop = () => {};

function createNoteGetter( options = {} ) {
	const defaultOptions = {
		fetch: getProxyFetch(),
		log: noop,
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
