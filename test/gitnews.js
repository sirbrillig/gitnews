/* global describe, it */
const { expect } = require( 'chai' );
const { getNotifications, setFetchFunction } = require( '../index' );

function getMockFetch( responseJson ) {
	const mockResponse = { json: () => responseJson };
	return function mockFetch() {
		return new Promise( ( resolve ) => {
			resolve( mockResponse );
		} );
	};
}

describe( 'gitnews', function() {
	describe( 'getNotifications()', function() {
		it( 'resolves with an array of notifications', function() {
			setFetchFunction( getMockFetch( [ {}, {} ] ) );
			return getNotifications( '123abc' )
				.then( results => {
					expect( results ).to.have.length( 2 );
				} );
		} );
	} );
} );
