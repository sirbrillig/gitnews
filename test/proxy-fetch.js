/* global describe, it */
const chai = require( 'chai' );
const chaiSubset = require( 'chai-subset' );
const sinon = require( 'sinon' );
const sinonChai = require( 'sinon-chai' );
const getProxyFetch = require( '../lib/proxy-fetch' );

chai.use( chaiSubset );
chai.use( sinonChai );
const { expect } = chai;

describe( 'proxyFetch()', function() {
	it( 'calls the fetch function if there is no cached response for that url', function() {
		const mockFetch = sinon.stub().returns( Promise.resolve( {} ) );
		const proxyFetch = getProxyFetch( { fetch: mockFetch } );
		return proxyFetch( 'url', {} )
		.then( () => {
			expect( mockFetch ).to.have.been.calledWith( 'url', {} );
		} );
	} );

	it( 'does not call the fetch function if there is a cached response for that url', function() {
		const mockFetch = sinon.stub().returns( Promise.resolve( { data: 'mock data' } ) );
		const proxyFetch = getProxyFetch( { fetch: mockFetch } );
		return proxyFetch( 'url', {} )
		.then( () => proxyFetch( 'url', {} ) )
		.then( () => {
			expect( mockFetch ).to.have.been.calledWith( 'url', {} ).calledOnce;
			expect( mockFetch ).to.have.been.calledOnce;
		} );
	} );

	it( 'calls the fetch function if there is a cached response for a different url', function() {
		const mockFetch = sinon.stub().returns( Promise.resolve( { data: 'mock data' } ) );
		const proxyFetch = getProxyFetch( { fetch: mockFetch } );
		return proxyFetch( 'url-1', {} )
		.then( () => proxyFetch( 'url-2', {} ) )
		.then( () => {
			expect( mockFetch ).to.have.been.calledWith( 'url-1', {} );
			expect( mockFetch ).to.have.been.calledWith( 'url-2', {} );
			expect( mockFetch ).to.have.been.calledTwice;
		} );
	} );
} );

