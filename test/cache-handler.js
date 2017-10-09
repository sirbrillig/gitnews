/* global describe, it */
const chai = require( 'chai' );
const getCacheHandler = require( '../lib/cache-handler' );

const { expect } = chai;

describe( 'getCachedResponseFor()', function() {
	it( 'returns undefined if there is no cache for a url', function() {
		const { getCachedResponseFor } = getCacheHandler();
		expect( getCachedResponseFor( 'url' ) ).to.be.undefined;
	} );

	it( 'returns cached data if there is a cache for a url', function() {
		const { getCachedResponseFor, cacheResponseFor } = getCacheHandler();
		cacheResponseFor( 'url', 'abcd' );
		expect( getCachedResponseFor( 'url' ) ).to.eql( 'abcd' );
	} );
} );
