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
	return () => Promise.resolve( getMockResponseObject( { json: responseJson, status: statusData.status, statusText: statusData.statusText } ) );
}

function getMockFetchForPatterns( patterns ) {
	return ( url, params ) => {
		const matchedPatternKey = Object.keys( patterns ).find( pattern => url.match( pattern ) );
		if ( ! matchedPatternKey ) {
			return Promise.resolve( getMockResponseObject( { status: 500 } ) );
		}
		const matchedPattern = patterns[ matchedPatternKey ];
		if ( params.method && matchedPattern.method && matchedPattern.method !== params.method ) {
			return Promise.resolve( getMockResponseObject( { status: 500 } ) );
		}
		return Promise.resolve( getMockResponseObject( matchedPattern ) );
	};
}

function isError( e ) {
	if ( typeof e === 'string' ) {
		return Promise.reject( new Error( e ) );
	}
	return Promise.resolve( e );
}

module.exports = {
	isError,
	getMockFetchForPatterns,
	getMockFetch,
	getMockResponseObject,
};
