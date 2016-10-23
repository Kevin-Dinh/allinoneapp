define([
	"dojo/Deferred",
	"dojo/_base/lang",
	"dojo/topic",
	"gjax/error",
	"dojo/request/util",
	"dojo/promise/Promise",
	"dojo/when",
	"dojo/promise/all"
], function(Deferred, lang, topic, error, util, Promise, when, all) {

	var freeze = Object.freeze || function(obj) {
		return obj;
	};

	function mixinPromise(promise, obj) {
		// summary:
		//		Creates new promise with 'obj' mixed into original promise
		// description:
		//		This method allow to add properties to promise. Promise object is frozen, so this method will 
		//		create new promise (with properties of original one), mix 'obj' into it and freeze it.
		// promise: dojo/promise/Promise
		//		original promisee
		// obj: Object
		//		object to mix into the promise
		// returns:	dojo/promise/Promise
		//		Newly creadted promise

		//inspired by dojo/request/util
		var newPromise = new Promise();
		for ( var prop in promise) {
			if (promise.hasOwnProperty(prop)) {
				newPromise[prop] = promise[prop];
			}
		}
		lang.mixin(newPromise, obj);
		freeze(newPromise);
		return newPromise;
	}

	function wrap(request, doBefore, doAfterCallback, doAfterErrback) {
		// summary:
		//		Wraps given request implementation to new one allowing to execute code before and after original request.
		// description:
		//		Function returns new request implementation (meaning a function, with 'post', 'put', etc. methods on it).
		//		This implementation will 
		//			- call optional 'doBefore' method (if provided)
		//			- call origin request, with possibly changed url and options
		//			- call 'doAfterCallback' when original request's promise is resolved (and if provided)
		//			- call 'doAfterErrback' when original request's promise is rejected (and if provided)
		//			- resolve returned promise with value from one of after callbacks or origin request (acordint to provided params)
		// request: 
		//		request implementation to wrap (e.g. dojo/request/xhr module)
		// doBefore: function?
		//		function called before original request, will receive requestArgs, object with url and options
		//		may return modified requestArgs (or promise resolved with ones), or nothing 
		//		(then original request args will be used in original request)
		// doAfterCallback: function?
		//		function called after original request's promsie is resolved
		//		will receive data from this promise, response (value that requestPromise.response resolves to)
		//		and deferred that will be returned as '.response' property on deferred returned from wrapped request
		//		function may return modified data or promise (or throw error) which will be used as resolved value
		//		for final promise, function may optionally resolve/reject 'returningResponsePromise' (3rd param)
		//		otherwise it will be resolved with response from original request
		// doAfterErrback: function?
		//		same as doAfterCallback, but will be called after original request's promsie is reject
		//		with two params, err (containing also pointer to response) and 'returningResponsePromise', 
		//		which again may be resolved/rejected here, otherwise will be rejected with error from original request
		// example:
		//		Sample of (sync) doBefore callback, which adds another header
		//		| var req = util.wrap(request, function(requestArgs) {
		//		| requestArgs.options.headers = {
		//		| 		"X-Test" : "foo"
		//		| 	};
		//		| 	return requestArgs;
		//		| });
		//		Sample of doAfterCallback, that will add additional data to original response
		//		| var req = util.wrap(request, null, function(data, response) {
		//		| 	return  lang.mixin(data, {ct:response.getHeader("Content-Type")});
		//		| });
		//		Sample of doAfterCallback, that will cause rejection on final promise, if response status is...
		//		| var req = util.wrap(request, null, function(data, response, returningResponsePromise) {
		//		|	if(response.status == NOT_WANTED_ONE) {
		//		| 		var err = error.newError(new Error(), "not wanted status");
		//		|		returningResponsePromise.reject(err);
		//		|		throw err;
		//		|	}
		//		|	return data;
		//		| });
		//		Sample of doAfterErrback, that will resolution on final promise, if err.code is...
		//		| var req = util.wrap(request, null, null, function(err, returningResponsePromise) {
		//		|	if(err.code == SOME_OK_CODE) {
		//		| 		return SOME_DEFAULT_DATA;
		//		|	}
		//		|	throw err;
		//		| });

		//If any of callbacks tends to resolve returningResponsePromise, 
		//make sure, it is resolved before the promise returned from this method
		//e.g:
		// 
		//	var r=request("a");
		//	r.response.then(returningResponsePromise.resolve, returningResponsePromise.reject);
		//
		//	return all([r,r.response]).then(function(results){
		//		return results[0];
		//	});

		var _req = function(url, options) {

			//promise that will be mixed into promise returned by _req method
			//it will be passed to before and after methods, which can resolve it, 
			// otherwise (most cases) will be resolve with response promise of original request
			var returningResponsePromise = new Deferred();
			var requestArgs = {
				url : url,
				options : options || {}
			};

			var xhrResponsePromise;

			//REVIEW: replace topics for other privite mechanism??
			topic.publish("block-operation", requestArgs);
			var cancelFn;
			var dataPromise = execBefore(doBefore, requestArgs, returningResponsePromise)//wait and modify params
			.then(function(modifiedRequestArgs) {//make origin request
				requestArgs = modifiedRequestArgs || requestArgs;
				var xhrDataPromise = request(requestArgs.url, requestArgs.options);
				xhrResponsePromise = xhrDataPromise.response;
				// AR,PM: dojo/promise/all.cancel doesnt cancel any passed promises, so do cancel on data promise.
				// this hack will correctly cancel running request
				// TODO: retry wrap and possibly other will not correctly cancel request, new request is created by new retry call, cancel will abort only first request
				cancelFn = lang.hitch(xhrDataPromise, function() {
					!this.isFulfilled() && this.cancel(); // if not resolved/rejected now, do cancel
				});
				return all({
					data : xhrDataPromise,
					response : xhrResponsePromise
				});
			}) //
			.then(createAfterCallback(doAfterCallback, returningResponsePromise), createAfterErrback(doAfterErrback, returningResponsePromise))//
			.then(function(data) {
				topic.publish("unblock-operation", requestArgs);
				if (!returningResponsePromise.isFulfilled()) {
					xhrResponsePromise.then(returningResponsePromise.resolve, returningResponsePromise.reject);
				}

				return data;
			}, function(error) {
				topic.publish("unblock-operation", requestArgs);
				if (!returningResponsePromise.isFulfilled()) {
					returningResponsePromise.reject(error);
				}

				throw error;
			});

			//inspired by from dojo/request/xhr
			return mixinPromise(dataPromise, {
				response : returningResponsePromise,
				cancel : function() {
					cancelFn();
				}
			});
		};

		util.addCommonMethods(_req); //this will add .get, .post.. methods
		return _req;

	}

	function execBefore(doBeforeFn, requestArgs, returningResponsePromise) {
		var dfd = new Deferred();

		if (!doBeforeFn) {
			dfd.resolve();
			return dfd;
		}
		try {
			return when(doBeforeFn(requestArgs, returningResponsePromise));
		} catch (err) {
			dfd.reject(err);
			return dfd;
		}
	}

	function createAfterCallback(callback, returningResponsePromise) {
		//if callback is not defined, pass data
		//otherwise call callback
		if (!callback) {
			return function(results) {
				return results.data;
			};
		}
		return function(results) {
			return callback(results.data, results.response, returningResponsePromise);
		};
	}

	function createAfterErrback(errback, returningResponsePromise) {
		//if callback is not defined, pass data
		//otherwise call callback
		if (!errback) {
			return null;
		}
		return function(err) {
			return errback(err, returningResponsePromise);
		};
	}

	return {
		// summary:
		//		Various functions useful when patching request stack

		freeze : freeze,
		wrap : wrap,
		mixinPromise : mixinPromise
	};
});