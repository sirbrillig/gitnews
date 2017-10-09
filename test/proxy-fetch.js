/* global describe, it */
const chai = require( 'chai' );
const chaiSubset = require( 'chai-subset' );
const sinon = require( 'sinon' );
const sinonChai = require( 'sinon-chai' );
const getProxyFetch = require( '../lib/proxy-fetch' );
const { Response } = require( 'node-fetch' );

chai.use( chaiSubset );
chai.use( sinonChai );
const { expect } = chai;

describe( 'proxyFetch()', function() {
	it( 'calls the fetch function if there is no cached response for that url', function() {
		const mockFetch = sinon.stub().returns( Promise.resolve( new Response() ) );
		const proxyFetch = getProxyFetch( { fetch: mockFetch } );
		return proxyFetch( 'url', {} )
		.then( () => {
			expect( mockFetch ).to.have.been.calledWith( 'url', {} );
		} );
	} );

	it( 'returns fetched Response correctly if there is no cached response for that url', function() {
		const mockFetch = sinon.stub().returns( Promise.resolve( new Response( '{"foo":"bar"}' ) ) );
		const proxyFetch = getProxyFetch( { fetch: mockFetch } );
		return proxyFetch( 'url', {} )
		.then( response => response.ok ? response : Promise.reject( response ) )
		.then( response => response.json() )
		.then( response => expect( response ).to.eql( { foo: 'bar' } ) );
	} );

	it( 'does not call the fetch function if there is a cached response for that url', function() {
		const mockFetch = sinon.stub().returns( Promise.resolve( new Response( '{"foo":"bar"}' ) ) );
		const proxyFetch = getProxyFetch( { fetch: mockFetch } );
		return proxyFetch( 'url', {} )
		.then( () => proxyFetch( 'url', {} ) )
		.then( () => {
			expect( mockFetch ).to.have.been.calledWith( 'url', {} ).calledOnce;
			expect( mockFetch ).to.have.been.calledOnce;
		} );
	} );

	it( 'calls the fetch function if there is a cached response for a different url', function() {
		const mockFetch = sinon.stub().returns( Promise.resolve( new Response( '{"foo":"bar"}' ) ) );
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
