/**
 * Extended version of dojo/ready with improved error handling
 * 
 * @see ready2.js also
 * @autor marcus, arakovsky
 */
define([
	"dojo/ready",
	"dojo/_base/lang",
	"gjax/error"
], function(ready, lang, error) {

	return function(priority, context, callback) {

		var hitchArgs = lang._toArray(arguments);
		if (typeof priority != "number") {
			callback = context;
			context = priority;
			priority = 1000;
		} else {
			hitchArgs.shift();
		}
		callback = callback ? lang.hitch.apply(dojo, hitchArgs) : function() {
			return context();
		};

		var wrappedCallback = function() {
			if (error && error.tryCatchFunction) {
				console.debug("gjax/ready.js: using custom");
				//AR: callback wrapped by err.tryCatchFunction
				var valueOrPromise = error.tryCatchFunction(callback)();
				// some ready handlers (parser.parse()) do return FAILED promise, and no one resolves them
				// hence the following code.
				error.tryCatchPromise(valueOrPromise);
				return valueOrPromise;
			} else {
				console.debug("gjax/ready.js: using default");
				return callback();
			}
		};

		ready(priority, wrappedCallback);
	};
});
