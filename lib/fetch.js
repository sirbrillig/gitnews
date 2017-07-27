const nodeFetch = require( 'node-fetch' );

let fetchFunction = nodeFetch;

function fetch( url, init = null ) {
	return fetchFunction( url, init );
}

function setFetchFunction( func ) {
	fetchFunction = func;
}

module.exports = {
	fetch,
	setFetchFunction,
};

