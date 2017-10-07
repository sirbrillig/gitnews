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

	function getResponseCacher( url, options ) {
		return function cacheResponse( response ) {
			debug( `> caching response for url '${ url }'` );
			// FIXME: this does not work because once we create the clone, this bug triggers: https://github.com/bitinn/node-fetch/issues/139
			responseCache[ url ] = { response: response.clone(), options };
			return response;
		};
	}

	function fetchAndCache( url, options ) {
		return getter.fetch( url, options )
		.then( getResponseCacher( url, options ) );
	}

	function getCachedResponse( url ) {
		const cachedResponse = responseCache[ url ];
		return cachedResponse ? cachedResponse.response : null;
	}

	return proxyFetch;
}

module.exports = getProxyFetch;
