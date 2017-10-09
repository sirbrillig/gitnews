/* global describe, it */
const chai = require( 'chai' );
const chaiSubset = require( 'chai-subset' );
const sinon = require( 'sinon' );
const sinonChai = require( 'sinon-chai' );
const { fetchNotifications } = require( '../lib/fetchers' );
const { Response } = require( 'node-fetch' );

chai.use( chaiSubset );
chai.use( sinonChai );
const { expect } = chai;
const noop = () => {};

describe( 'fetchNotifications()', function() {
	it( 'calls the fetch function if there is no cached response for that url', function() {
		const mockFetch = sinon.stub().returns( Promise.resolve( new Response( '[{"foo":"bar"}]' ) ) );
		return fetchNotifications( { fetch: mockFetch, log: noop, getCachedResponseFor: noop, cacheResponseFor: noop }, 'token' )
		.then( () => {
			expect( mockFetch ).to.have.been.called;
		} );
	} );

	it( 'returns fetched Response correctly if there is no cached response for that url', function() {
		const mockFetch = sinon.stub().returns( Promise.resolve( new Response( '[{"foo":"bar"}]' ) ) );
		return fetchNotifications( { fetch: mockFetch, log: noop, getCachedResponseFor: noop, cacheResponseFor: noop }, 'token' )
		.then( response => expect( response ).to.eql( [ { foo: 'bar' } ] ) );
	} );

	it( 'does not call the fetch function if there is a cached response for that url', function() {
		const mockFetch = sinon.stub().returns( Promise.resolve( new Response( '[{"foo":"bar"}]' ) ) );
		const getCachedResponseFor = () => ( [ { foo: 'bar' } ] );
		return fetchNotifications( { fetch: mockFetch, log: noop, getCachedResponseFor, cacheResponseFor: noop }, 'token' )
		.then( () => {
			expect( mockFetch ).to.not.have.been.called;
		} );
	} );
} );
