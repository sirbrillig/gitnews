const nodeFetch = require( 'node-fetch' );
const noop = () => {};
const debugFactory = require( 'debug' );

const debug = debugFactory( 'proxy-fetch' );

function getProxyFetch( getter = {} ) {
	const responseCache = {};
	const getterDefaults = { fetch: nodeFetch, log: noop };
	getter = Object.assign( getterDefaults, getter );

	const proxyFetch = function( url, options ) {
		debug( `starting proxyFetch for url '${ url }'` );
		const cachedResponse = getCachedResponse( url );
		cachedResponse ? debug( `< using cached response for url '${ url }'` ) : debug( `x no cached response for url '${ url }'` );
		return cachedResponse ? Promise.resolve( cachedResponse ) : fetchAndCache( url, options );
	};

	function fetchAndCache( url, options ) {
		const cacheResponse = response => {
			debug( `> caching response for url '${ url }'` );
			responseCache[ url ] = { response, options };
			return response;
		};
		return getter.fetch( url, options )
		.then( cacheResponse );
	}

	function getCachedResponse( url ) {
		const cachedResponse = responseCache[ url ];
		return cachedResponse ? cachedResponse.response : null;
	}

	return proxyFetch;
}

module.exports = getProxyFetch;
