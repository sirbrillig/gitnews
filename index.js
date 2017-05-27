const md5Hex = require( 'md5-hex' );
const { setLogger } = require( './lib/logger' );
const { fetchNotifications, getAdditionalDataFetcher } = require( './lib/fetchers' );

function convertToGitnews( notifications ) {
	return notifications.map( apiData => {
		return {
			api: {
				notification: apiData,
				subject: null, // will be filled-in later
				comment: null, // will be filled-in later
			},
			id: md5Hex( apiData.id + apiData.updated_at ),
			unread: apiData.unread,
			title: apiData.subject.title,
			type: apiData.subject.type,
			updatedAt: apiData.updated_at,
			'private': apiData.private,
			repositoryName: apiData.repository.name,
			repositoryFullName: apiData.repository.full_name,
			repositoryOwnerAvatar: apiData.repository.owner.avatar_url,
			subjectUrl: null, // will be filled-in later
			commentUrl: null, // will be filled-in later
			commentAvatar: null, // will be filled-in later
		};
	} );
}

// -------------

function getNotifications( token, params = {} ) {
	const fetchAdditionalData = getAdditionalDataFetcher( token );
	return fetchNotifications( token, Object.assign( { all: true }, params ) )
		.then( convertToGitnews )
		.then( fetchAdditionalData );
}

module.exports = {
	setLogger,
	getNotifications,
};
