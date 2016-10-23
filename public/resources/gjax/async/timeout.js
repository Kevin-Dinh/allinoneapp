define([
	"dojo/Deferred"
], function(Deferred) {
	
	
	
	return function(time, value) {
		// summary:
		//		Method creates a deferred that will be resolved after given timeout
		// time:
		//		time after which the deferred will be resolved
		// value:
		//		deferred will be resolved with this value
		// returns:	dojo/Deferred
		//		Deferred resolved with given value after given timeout
		
		var dfd = new Deferred();

		setTimeout(function() {
			dfd.resolve(value);
		}, time);

		return dfd;
	};
});