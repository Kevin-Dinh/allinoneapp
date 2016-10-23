define([
	"dojo/promise/all",
	"dojo/Deferred"
], function(all, Deferred) {

	// taken from:
	// 		https://github.com/cujojs/when/blob/master/node/function.js

	// TODO: refactor, remove unexported functions? extract apply?
	var slice = Array.prototype.slice;

	return lift;

	// Takes a node-style function and returns new function that wraps the
	// original and, instead of taking a callback, returns a promise.
	function lift(func /*, args... */) {
		var args = slice.call(arguments, 1);
		return function(/* fnArgs */) {
			var fnArgs = slice.call(arguments);
			return apply(func, args.concat(fnArgs));
		};
	}

	// Takes a node-style async function and calls it immediately (with an optional
	// array of arguments). It returns a promise whose resolution depends on whether
	// the async functions calls its callback with the conventional error argument or not.
	function apply(func, args) {
		var resolver = new Deferred();
		var callback = createCallback(resolver);
		func.apply(null, args.concat(callback));
		return resolver.promise;
	}

	// Takes an object that responds to the resolver interface, and returns
	// a function that will resolve or reject it depending on how it is called.
	function createCallback(resolver) {
		return function(err, value) {
			if (err) {
				resolver.reject(err);
			} else if (arguments.length > 2) {
				resolver.resolve(slice.call(arguments, 1));
			} else {
				resolver.resolve(value);
			}
		};
	}
});