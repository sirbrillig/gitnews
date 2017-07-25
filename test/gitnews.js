/* global describe, it */
const { expect } = require( 'chai' );
const { getNotifications, setFetchFunction } = require( '../index' );

function getMockFetch( responseJson, statusData = {} ) {
	const status = statusData.status || 200;
	const mockResponse = {
		ok: status > 199 && status < 300,
		status,
		statusText: statusData.statusText || 'OK',
		json: () => Promise.resolve( responseJson ),
	};
	return () => Promise.resolve( mockResponse );
}

describe( 'gitnews', function() {
	describe( 'getNotifications()', function() {
		it( 'rejects if the server returns an http error', function( done ) {
			setFetchFunction( getMockFetch( [ {} ], { status: 400 } ) );
			getNotifications( '123abc' )
				.catch( () => {
					done();
				} );
		} );

		it( 'resolves with an array of notifications', function() {
			setFetchFunction( getMockFetch( [ {}, {} ] ) );
			return getNotifications( '123abc' )
				.then( results => {
					expect( results ).to.have.length( 2 );
				} );
		} );

		it( 'resolves with notifications that each have a unique id with invalid data', function() {
			setFetchFunction( getMockFetch( [ {}, {} ] ) );
			return getNotifications( '123abc' )
				.then( results => {
					expect( results[ 0 ].id ).to.not.equal( results[ 1 ].id );
				} );
		} );

		it( 'resolves with notifications that each have a unique id with valid data', function() {
			setFetchFunction( getMockFetch( [
				{ id: 5, updated_at: '123454' }, // eslint-disable-line camelcase
				{ id: 6, updated_at: '123456' }, // eslint-disable-line camelcase
			] ) );
			return getNotifications( '123abc' )
				.then( results => {
					expect( results[ 0 ].id ).to.not.equal( results[ 1 ].id );
				} );
		} );
	} );
} );
