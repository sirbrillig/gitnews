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

module.exports = {
	isError,
	getMockFetchForPatterns,
	getMockFetch,
	getMockResponseObject,
};
