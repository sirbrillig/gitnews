let logFunction = () => null;

function log( message ) {
	logFunction( message );
}

function setLogger( logger ) {
	logFunction = logger;
}

module.exports = {
	log,
	setLogger,
};
