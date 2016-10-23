/**
 * created 2013/02/14
 * 
 * @author Adrian Rakovsky
 */
define([
	"dojo/request/util",
	"dojo/request/xhr",
	"dojo/Deferred",
	"gjax/async/timeout",
	"dojo/promise/all",
	"dojox/lang/functional",
	"dojo/json",
	"dojox/lang/functional/fold"
], function(util, xhr, Deferred, timeout, all, df, json) {

	// summary:
	//		dojo/request (mock) implementation that return reuest's method, url, headers and body in response body

	// Purpose of this module is for testing various request related modules

	function reflectRequest(url, options) { //mock request that return method, url and headers in response
		if (options.passToXhr) {
			return xhr(url, options);
		}
		var responseData = {
			method : options.method.toUpperCase(),
			url : url,
			headers : df.reduce(options.headers || {}, function reducer(headers, value, key) {
				headers[key.toLowerCase()] = value; //in response, headers are expected to be lower case (TODO: check this)
				return headers;
			}, {}),
			content : options.data && json.stringify(options.data)
		};
		var responseDfd = new Deferred();
		responseDfd.response = timeout(10, {});
		timeout(10, responseData).then(responseDfd.resolve);
		return responseDfd;
	}
	util.addCommonMethods(reflectRequest);

	return reflectRequest;
});
