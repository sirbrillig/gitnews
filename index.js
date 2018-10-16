const {
	defaultFetch,
	fetchNotifications,
	getAdditionalDataFetcher,
	sendMarkNotificationRead
} = require( './lib/fetchers' );
const { makeConverter } = require( './lib/converter' );

function createNoteGetter( options = {} ) {
	const defaultOptions = {
		fetch: defaultFetch,
		log: () => {},
	};
	const mergedOptions = Object.assign( {}, defaultOptions, options );
	const convertToGitnews = makeConverter();
	return function getNotifications( token, params = {} ) {
		const fetchAdditionalData = getAdditionalDataFetcher( mergedOptions, token );
		return fetchNotifications( mergedOptions, token, Object.assign( { all: true }, params ) )
			.then( convertToGitnews )
			.then( fetchAdditionalData );
	};
}

function createNoteMarkRead( options = {} ) {
	const defaultOptions = {
		fetch: defaultFetch,
		log: () => {},
	};
	const mergedOptions = Object.assign( {}, defaultOptions, options );
	return function markNotificationRead( token, note, params = {} ) {
		return sendMarkNotificationRead( mergedOptions, token, note, params );
	};
}

module.exports = {
	createNoteGetter,
	createNoteMarkRead,
	getNotifications: createNoteGetter(),
	markNotificationRead: createNoteMarkRead(),
};
