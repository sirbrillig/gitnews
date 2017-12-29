/* global describe, it */
const chai = require( 'chai' );
const chaiSubset = require( 'chai-subset' );
const sinon = require( 'sinon' );
const sinonChai = require( 'sinon-chai' );
const { createNoteGetter } = require( '../index' );
const {
	isError,
	getMockFetchForPatterns,
	getMockFetch,
} = require( './helpers.js' );

chai.use( chaiSubset );
chai.use( sinonChai );
const { expect } = chai;
const noop = () => {};

describe( 'gitnews', function() {
	describe( 'getNotifications()', function() {
		it( 'requests the GitHub notifications API', function() {
			return new Promise( ( resolve ) => {
				const getNotifications = createNoteGetter( { fetch: resolve, getCachedResponseFor: noop } );
				getNotifications( '123abc' );
			} )
				.then( ( url ) => {
					expect( url ).to.equal( 'https://api.github.com/notifications?all=true' );
				} );
		} );

		it( 'rejects if no token was provided', function() {
			const fetch = getMockFetch( [ {} ], { status: 200 } );
			const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
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
			const fetch = getMockFetch( [ {} ], { status: 200 } );
			const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
			return getNotifications()
				.catch( isError )
				.then( err => {
					expect( err.code ).to.equal( 'GitHubTokenNotFound' );
				} );
		} );

		it( 'rejects if the server returns an error message', function() {
			const fetch = getMockFetch( { message: 'something failed' } );
			const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
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
			const fetch = getMockFetch( { foo: 'bar' } );
			const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
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
			const fetch = getMockFetch( [ {} ], { status: 400 } );
			const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
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
			const fetch = getMockFetch( [ {} ], { status: 418 } );
			const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
			return getNotifications( '123abc' )
				.catch( isError )
				.then( err => {
					expect( err.status ).to.equal( 418 );
				} );
		} );

		it( 'rejects if the notifications were fetched but fetching the subject failed', function() {
			const fetch = getMockFetchForPatterns( {
				notifications: {
					json: [ { id: 1, subject: { url: 'subjectUrl', latest_comment_url: 'commentUrl' } } ], // eslint-disable-line camelcase
				},
				subjectUrl: { status: 418 },
				'.': { status: 500 }
			} );
			const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
			return getNotifications( '123abc' )
				.catch( isError )
				.then( err => {
					expect( err.status ).to.equal( 418 );
				} );
		} );

		it( 'rejects if the notifications were fetched but fetching the comment failed', function() {
			const fetch = getMockFetchForPatterns( {
				'notifications|subjectUrl': {
					json: [ { id: 1, subject: { url: 'subjectUrl', latest_comment_url: 'commentUrl' } } ], // eslint-disable-line camelcase
				},
				commentUrl: { status: 418 },
				'.': { status: 500 }
			} );
			const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
			return getNotifications( '123abc' )
				.catch( isError )
				.then( err => {
					expect( err.status ).to.equal( 418 );
				} );
		} );

		describe( 'when it resolves', function() {
			it( 'is an array', function() {
				const fetch = getMockFetch( [ {}, {} ] );
				const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
				return getNotifications( '123abc' )
					.then( results => {
						expect( results ).to.have.length( 2 );
					} );
			} );

			it( 'calls the fetch function once for each url if caching is disabled', function() {
				const fetch = sinon.stub().callsFake( getMockFetchForPatterns( {
					notification: { json: [
						{ id: 5, subject: { url: 'subjectUrl' } },
						{ id: 6, subject: { url: 'subjectUrl' } },
					] },
					subjectUrl: { json: { html_url: 'htmlUrl' } }, // eslint-disable-line camelcase
				} ) );
				const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
				return getNotifications( '123abc' )
					.then( () => {
						expect( fetch ).to.have.callCount( 5 );
					} );
			} );

			it( 'does not call the fetch function for a url that has already been fetched if caching is enabled', function() {
				const fetch = sinon.stub().callsFake( getMockFetchForPatterns( {
					notification: { json: [
						{ id: 5, subject: { url: 'subjectUrl' } },
						{ id: 6, subject: { url: 'subjectUrl' } },
					] },
					subjectUrl: { json: { html_url: 'htmlUrl' } }, // eslint-disable-line camelcase
				} ) );
				const getNotifications = createNoteGetter( { fetch } );
				return getNotifications( '123abc' )
					.then( () => {
						// TODO: the cache fails for the subject calls because the second
						// call to fetch is triggered before the first call completes
						// (Promise.all), so the cache misses on the second call. It succeeds
						// for the comment fetches because they only happen after the subject
						// fetches are all complete.
						expect( fetch ).to.have.callCount( 3 );
					} );
			} );

			describe( 'each notification', function() {
				it( 'has a unique id even when data is invalid', function() {
					const fetch = getMockFetch( [ {}, {} ] );
					const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].id ).to.not.equal( results[ 1 ].id );
						} );
				} );

				it( 'has a unique id when data is valid', function() {
					const fetch = getMockFetch( [
						{ id: 5, updated_at: '123454' }, // eslint-disable-line camelcase
						{ id: 6, updated_at: '123456' }, // eslint-disable-line camelcase
					] );
					const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].id ).to.not.equal( results[ 1 ].id );
						} );
				} );

				it( 'includes the raw api responses', function() {
					const fetch = getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, foo: 'bar', subject: { url: 'subjectUrl' } },
							{ id: 6, subject: { url: 'subjectUrl' } },
						] },
						subjectUrl: { json: { html_url: 'htmlUrl' } }, // eslint-disable-line camelcase
					} );
					const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].api.notification.foo ).to.equal( 'bar' );
							expect( results[ 1 ].api.subject.html_url ).to.equal( 'htmlUrl' );
							expect( results[ 1 ].api.comment.html_url ).to.equal( 'htmlUrl' );
						} );
				} );

				it( 'includes subjectUrl', function() {
					const fetch = getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl' } },
						] },
						subjectUrl: { json: { html_url: 'htmlUrl' } }, // eslint-disable-line camelcase
					} );
					const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].subjectUrl ).to.equal( 'htmlUrl' );
						} );
				} );

				it( 'includes commentUrl set to subjectUrl if no comment exists', function() {
					const fetch = getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl' } },
						] },
						subjectUrl: { json: { html_url: 'htmlUrl' } }, // eslint-disable-line camelcase
					} );
					const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].commentUrl ).to.equal( 'htmlUrl' );
						} );
				} );

				it( 'includes commentUrl set to commentUrl if a comment exists', function() {
					const fetch = getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl', latest_comment_url: 'commentUrl' } }, // eslint-disable-line camelcase
						] },
						subjectUrl: { json: { html_url: 'htmlSubjectUrl' } }, // eslint-disable-line camelcase
						commentUrl: { json: { html_url: 'htmlCommentUrl' } }, // eslint-disable-line camelcase
					} );
					const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].commentUrl ).to.equal( 'htmlCommentUrl' );
						} );
				} );

				it( 'includes commentAvatar set to last comment avatar_url if a comment exists', function() {
					const fetch = getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl', latest_comment_url: 'commentUrl' } }, // eslint-disable-line camelcase
						] },
						subjectUrl: { json: { html_url: 'htmlSubjectUrl' } }, // eslint-disable-line camelcase
						commentUrl: { json: { html_url: 'htmlCommentUrl', user: { avatar_url: 'avatarUrl' } } }, // eslint-disable-line camelcase
					} );
					const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].commentAvatar ).to.equal( 'avatarUrl' );
						} );
				} );

				it( 'includes commentAvatar set to subject avatar_url if no comment exists', function() {
					const fetch = getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl' } }, // eslint-disable-line camelcase
						] },
						subjectUrl: { json: { html_url: 'htmlSubjectUrl', user: { avatar_url: 'subjectAvatarUrl' } } }, // eslint-disable-line camelcase
					} );
					const getNotifications = createNoteGetter( { fetch } );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].commentAvatar ).to.equal( 'subjectAvatarUrl' );
						} );
				} );

				it( 'includes commentAvatar set to subject avatar_url if comment returns a 404', function() {
					const fetch = getMockFetchForPatterns( {
						notification: { json: [
							{ id: 5, subject: { url: 'subjectUrl', latest_comment_url: 'commentUrl' } }, // eslint-disable-line camelcase
						] },
						subjectUrl: { json: { html_url: 'htmlSubjectUrl', user: { avatar_url: 'subjectAvatarUrl' } } }, // eslint-disable-line camelcase
						commentUrl: { status: 404 },
					} );
					const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ].commentAvatar ).to.equal( 'subjectAvatarUrl' );
						} );
				} );

				it( 'includes fields copied from notification request', function() {
					const fetch = getMockFetchForPatterns( {
						notification: { json: [
							{
								id: 5,
								subject: { url: 'subjectUrl', latest_comment_url: 'commentUrl', title: 'myTitle', type: 'myType' }, // eslint-disable-line camelcase
								unread: true,
								updated_at: '123456', // eslint-disable-line camelcase
								'private': true,
								repository: { name: 'myRepo', full_name: 'myFullRepo', owner: { avatar_url: 'ownerAvatarUrl' } }, // eslint-disable-line camelcase
							},
						] },
						subjectUrl: { json: { html_url: 'htmlSubjectUrl' } }, // eslint-disable-line camelcase
						commentUrl: { json: { html_url: 'htmlCommentUrl' } }, // eslint-disable-line camelcase
					} );
					const getNotifications = createNoteGetter( { fetch, getCachedResponseFor: noop } );
					return getNotifications( '123abc' )
						.then( results => {
							expect( results[ 0 ] ).to.containSubset( {
								unread: true,
								title: 'myTitle',
								type: 'myType',
								updatedAt: '123456',
								'private': true,
								repositoryName: 'myRepo',
								repositoryFullName: 'myFullRepo',
								repositoryOwnerAvatar: 'ownerAvatarUrl',
							} );
						} );
				} );
			} );
		} );
	} );
} );
