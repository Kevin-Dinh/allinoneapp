/**
 * created 2013/02/14
 * 
 * @author Adrian Rakovsky
 * @description Extended dojo/request/xhr to simplify using XHR rquirests with JSON as payload.
 */
define([
	"dojo/request/xhr",
	"dojo/request/util",
	"dojo/json",
	"gjax/error/_httpHandler",
	"gjax/error",
	"gjax/uri/Uri"
], function(xhr, util, json, _httpHandler, error, Uri) {

	var defaultOptions = {
		data : null,
		query : null,
		sync : false,
		handleAs : "json",
		method : "GET",
		headers : {
			"Content-Type" : "application/json",/* git-qa */
			"Accept" : "application/json"
		}
	};
	function jsonXhr(url, options, returnDeferred) {
		options = util.deepCreate(defaultOptions, options);
		options.data = typeof options.data == "string" ? options.data : (options.data && json.stringify(options.data));

		//IE breaks point 9 in http://www.w3.org/TR/XMLHttpRequest/#the-open()-method and sends fragment, so strip it here
		url = Uri.setFragment(url, null);
		return jsonXhr._callXhr(url, options, returnDeferred);
	}

	jsonXhr._callXhr = function(url, options, returnDeferred) {
		// extracted as method to allow overriding in app
		var dfd = xhr(url, options, returnDeferred);
		dfd.then(error.callbackNoop, _httpHandler.handle);
		// This implmentation rely on order of registred callbacks, not chaining.
		// Chaining cannot be used, because client would not have access to .response property on promise
		// '.otherwise' cannot be used because returned value from xhr isn't always Promise, it can be also Deferred (returnDeferred param)
		return dfd;
	};

	/*=====
	jsonXhr = function(url, options){
		// summary:
		//		Sends a request using XMLHttpRequest with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/xhr.__Options?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	jsonXhr.get = function(url, options){
		// summary:
		//		Send an HTTP GET request using XMLHttpRequest with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/xhr.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	jsonXhr.post = function(url, options){
		// summary:
		//		Send an HTTP POST request using XMLHttpRequest with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/xhr.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	jsonXhr.put = function(url, options){
		// summary:
		//		Send an HTTP PUT request using XMLHttpRequest with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/xhr.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	jsonXhr.del = function(url, options){
		// summary:
		//		Send an HTTP DELETE request using XMLHttpRequest with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/xhr.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	=====*/

	util.addCommonMethods(jsonXhr);

	return jsonXhr;
});
