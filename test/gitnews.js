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

function isError( e ) {
	if ( typeof e === 'string' ) {
		return Promise.reject( new Error( e ) );
	}
	return Promise.resolve( e );
}

describe( 'gitnews', function() {
	describe( 'getNotifications()', function() {
		it( 'rejects if no token was provided', function() {
			setFetchFunction( getMockFetch( [ {} ], { status: 200 } ) );
			return getNotifications()
				.then( () => {
					return Promise.reject( 'Missing token did not reject Promise.' );
				} )
				.catch( isError )
				.then( err => {
					expect( err ).to.be.ok;
				} );
		} );

		it( 'rejects if no token was provided with code GitHubTokenNotFound', function() {
			setFetchFunction( getMockFetch( [ {} ], { status: 200 } ) );
			return getNotifications()
				.catch( isError )
				.then( err => {
					expect( err.code ).to.equal( 'GitHubTokenNotFound' );
				} );
		} );

		it( 'rejects if the server returns an error message', function() {
			setFetchFunction( getMockFetch( { message: 'something failed' } ) );
			return getNotifications( '123abc' )
				.then( () => {
					return Promise.reject( 'Failure message did not reject Promise.' );
				} )
				.catch( isError )
				.then( err => {
					expect( err.message ).to.equal( 'something failed' );
				} );
		} );

		it( 'rejects if the server returns a non-array', function() {
			setFetchFunction( getMockFetch( { foo: 'bar' } ) );
			return getNotifications( '123abc' )
				.then( () => {
					return Promise.reject( 'Non-array did not reject Promise.' );
				} )
				.catch( isError )
				.then( err => {
					expect( err.message ).to.equal( 'Notifications list is not an array.' );
				} );
		} );

		it( 'rejects if the server returns an http error', function() {
			setFetchFunction( getMockFetch( [ {} ], { status: 400 } ) );
			return getNotifications( '123abc' )
				.then( () => {
					return Promise.reject( 'Failed http did not reject Promise.' );
				} )
				.catch( isError )
				.then( err => {
					expect( err ).to.be.ok;
				} );
		} );

		it( 'rejects with the status code if the server returns an http error', function() {
			setFetchFunction( getMockFetch( [ {} ], { status: 418 } ) );
			return getNotifications( '123abc' )
				.catch( isError )
				.then( err => {
					expect( err.status ).to.equal( 418 );
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
