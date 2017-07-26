/* global describe, it */
const { expect } = require( 'chai' );
const { getNotifications, setFetchFunction } = require( '../index' );

function getResponseObject( responseJson, statusData = {} ) {
	const status = statusData.status || 200;
	return {
		ok: status > 199 && status < 300,
		status,
		statusText: statusData.statusText || 'OK',
		json: () => Promise.resolve( responseJson ),
	};
}

function getMockResponseObject( responseData ) {
	const json = responseData.json || null;
	const status = responseData.status || 200;
	return {
		ok: status > 199 && status < 300,
		status,
		statusText: responseData.statusText || 'OK',
		json: () => Promise.resolve( json ),
	};
}

function getMockFetch( responseJson, statusData = {} ) {
	return () => Promise.resolve( getResponseObject( responseJson, statusData ) );
}

function getMockFetchForPatterns( patterns ) {
	return ( url ) => {
		const matchedPattern = Object.keys( patterns ).find( pattern => url.match( pattern ) );
		if ( matchedPattern ) {
			return Promise.resolve( getMockResponseObject( patterns[ matchedPattern ] ) );
		}
		return Promise.resolve( getMockResponseObject( { status: 500 } ) );
	};
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

		it( 'rejects if the notifications were fetched but fetching the subject failed', function() {
			setFetchFunction( getMockFetchForPatterns( {
				notifications: {
					json: [ { id: 1, subject: { url: 'subjectUrl', latest_comment_url: 'commentUrl' } } ], // eslint-disable-line camelcase
				},
				subjectUrl: { status: 418 },
				'.': { status: 500 }
			} ) );
			return getNotifications( '123abc' )
				.catch( isError )
				.then( err => {
					expect( err.status ).to.equal( 418 );
				} );
		} );

		it( 'rejects if the notifications were fetched but fetching the comment failed', function() {
			setFetchFunction( getMockFetchForPatterns( {
				'notifications|subjectUrl': {
					json: [ { id: 1, subject: { url: 'subjectUrl', latest_comment_url: 'commentUrl' } } ], // eslint-disable-line camelcase
				},
				commentUrl: { status: 418 },
				'.': { status: 500 }
			} ) );
			return getNotifications( '123abc' )
				.catch( isError )
				.then( err => {
					expect( err.status ).to.equal( 418 );
				} );
		} );

		describe( 'when it resolves', function() {
			it( 'is an array', function() {
				setFetchFunction( getMockFetch( [ {}, {} ] ) );
				return getNotifications( '123abc' )
					.then( results => {
						expect( results ).to.have.length( 2 );
					} );
			} );

			describe( 'each notification', function() {
				it( 'has a unique id even when data is invalid', function() {
					setFetchFunction( getMockFetch( [ {}, {} ] ) );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].id ).to.not.equal( results[ 1 ].id );
						} );
				} );

				it( 'has a unique id when data is valid', function() {
					setFetchFunction( getMockFetch( [
						{ id: 5, updated_at: '123454' }, // eslint-disable-line camelcase
						{ id: 6, updated_at: '123456' }, // eslint-disable-line camelcase
					] ) );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].id ).to.not.equal( results[ 1 ].id );
						} );
				} );

				it( 'includes the raw api responses', function() {
					setFetchFunction( getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, foo: 'bar', subject: { url: 'subjectUrl' } },
							{ id: 6, subject: { url: 'subjectUrl' } },
						] },
						subjectUrl: { json: { html_url: 'htmlUrl' } }, // eslint-disable-line camelcase
					} ) );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].api.notification.foo ).to.equal( 'bar' );
							expect( results[ 1 ].api.subject.html_url ).to.equal( 'htmlUrl' );
							expect( results[ 1 ].api.comment.html_url ).to.equal( 'htmlUrl' );
						} );
				} );

				it( 'includes subjectUrl', function() {
					setFetchFunction( getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl' } },
						] },
						subjectUrl: { json: { html_url: 'htmlUrl' } }, // eslint-disable-line camelcase
					} ) );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].subjectUrl ).to.equal( 'htmlUrl' );
						} );
				} );

				it( 'includes commentUrl set to subjectUrl if no comment exists', function() {
					setFetchFunction( getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl' } },
						] },
						subjectUrl: { json: { html_url: 'htmlUrl' } }, // eslint-disable-line camelcase
					} ) );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].commentUrl ).to.equal( 'htmlUrl' );
						} );
				} );

				it( 'includes commentUrl set to commentUrl if a comment exists', function() {
					setFetchFunction( getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl', latest_comment_url: 'commentUrl' } }, // eslint-disable-line camelcase
						] },
						subjectUrl: { json: { html_url: 'htmlSubjectUrl' } }, // eslint-disable-line camelcase
						commentUrl: { json: { html_url: 'htmlCommentUrl' } }, // eslint-disable-line camelcase
					} ) );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].commentUrl ).to.equal( 'htmlCommentUrl' );
						} );
				} );

				it( 'includes commentAvatar set to last comment avatar_url if a comment exists', function() {
					setFetchFunction( getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl', latest_comment_url: 'commentUrl' } }, // eslint-disable-line camelcase
						] },
						subjectUrl: { json: { html_url: 'htmlSubjectUrl' } }, // eslint-disable-line camelcase
						commentUrl: { json: { html_url: 'htmlCommentUrl', user: { avatar_url: 'avatarUrl' } } }, // eslint-disable-line camelcase
					} ) );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].commentAvatar ).to.equal( 'avatarUrl' );
						} );
				} );

				it( 'includes commentAvatar set to subject avatar_url if no comment exists', function() {
					setFetchFunction( getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl' } }, // eslint-disable-line camelcase
						] },
						subjectUrl: { json: { html_url: 'htmlSubjectUrl', user: { avatar_url: 'subjectAvatarUrl' } } }, // eslint-disable-line camelcase
						commentUrl: { json: { html_url: 'htmlCommentUrl', user: { avatar_url: 'commentAvatarUrl' } } }, // eslint-disable-line camelcase
					} ) );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].commentAvatar ).to.equal( 'subjectAvatarUrl' );
						} );
				} );
			} );
		} );
	} );
} );
