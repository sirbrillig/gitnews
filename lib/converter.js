const md5Hex = require( 'md5-hex' );
const get = require( 'lodash.get' );

function makeConverter() {
	// Used to make sure invalid api responses still have a unique ID
	let uniqueIndex = Date.now();

	return function convertToGitnews( notifications ) {
		return notifications.map( apiData => {
			if ( ! apiData ) {
				apiData = {};
			}
			uniqueIndex += Date.now();
			return {
				api: {
					notification: apiData,
					subject: null, // will be filled-in later
					comment: null, // will be filled-in later
				},
				id: md5Hex( get( apiData, 'id', uniqueIndex ) + get( apiData, 'updated_at', '1' ) ),
				unread: apiData.unread,
				title: get( apiData, 'subject.title', '' ),
				type: get( apiData, 'subject.type', '' ),
				updatedAt: apiData.updated_at,
				'private': apiData.private,
				repositoryName: get( apiData, 'repository.name', '' ),
				repositoryFullName: get( apiData, 'repository.full_name', '' ),
				repositoryOwnerAvatar: get( apiData, 'repository.owner.avatar_url', '' ),
				subjectUrl: null, // will be filled-in later
				commentUrl: null, // will be filled-in later
				commentAvatar: null, // will be filled-in later
			};
		} );
	};
}

module.exports = {
	makeConverter,
};
