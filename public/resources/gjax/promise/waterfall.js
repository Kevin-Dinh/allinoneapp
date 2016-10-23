define([
	"dojo/Deferred"
], function(Deferred) {
	// summary:
	//		Build .then(f1).then(f2).then(f3)... chain if you have dynamic list of functions
	// description:
	//		isnpired by //https://github.com/caolan/async
	// example:
	//		
	//		| waterfall([f1,f2,f3])(param1) means f1(param1).then(f2).then(f3)
	return function(functions) {
		return function(param) {
			// returns promise
			return (functions || []).reduce(function(promise, funct) {
				return promise.then(funct);
			}, (new Deferred()).resolve(param));
		};
	};
});