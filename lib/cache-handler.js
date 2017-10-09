const debugFactory = require( 'debug' );

const debug = debugFactory( 'cache-handler' );

function getCacheHandler() {
	const responseCache = {};

	function getCachedResponseFor( url ) {
		const cachedResponse = responseCache[ url ];
		cachedResponse ? debug( `< using cached response for url '${ url }'` ) : debug( `x no cached response for url '${ url }'` );
		return cachedResponse;
	}

	function cacheResponseFor( url, data ) {
		debug( `> caching response for url '${ url }'` );
		responseCache[ url ] = data;
	}

	return {
		getCachedResponseFor,
		cacheResponseFor,
	};
}

module.exports = getCacheHandler;
