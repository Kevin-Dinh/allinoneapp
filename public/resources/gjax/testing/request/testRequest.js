/**
 * created 2013/02/14
 * 
 * @author Adrian Rakovsky
 */
define([
	"gjax/request/jsonXhr",
	"dojo/request/util",
	"gjax/XString",
	"dojo/Deferred",
	"gjax/uri/Uri",
	"dojo/promise/all"
], function(jsonXhr, util, stringUtils, Deferred, Uri, all) {

	// summary:
	//		dojo/request implementation that remaps requests to JSON files
	// description:
	//		If request URL denotes a folder “index.{method}.json will be appended.
	//		If last segment of request URL does not have extension “.{method}.json” will be appended
	//		Response may be optionaly wrapped into a envelope with two properties 'content' and 'headers',
	//		which values will be used as HTTP headers and response data
	//		See /tst-ui/src/main/webapp/WEB-INF/views/test/dojox-json/smd/_mocks for sample data
	
	// Purpose of this module is simulate various HTTP methods and headers from static files
	// Dojo solves this problem in test by mock services in PHP, we used to do it with JSPX, but now only static files after moving all tests to gjax
	// If this is not enought, use some simple node server
	// This may be helpful as well:
	//		http://www.cgi-node.org/
	//		https://code.google.com/archive/p/teajs/wikis/ApacheConfiguration.wiki

	function request(url, options) {
		var dfd = new Deferred();

		var q = Uri.getQuery(url);
		url = Uri.setQuery(url, null);
		if (Uri.denotesFolder(url)) {
			url += "index." + options.method.toLowerCase() + ".json";
		} else if (!~Uri.getLastSegment(url).indexOf(".")) {
			url += "." + options.method.toLowerCase() + ".json";
		}
		url = Uri.setQuery(url, q);

		var dataPromise = jsonXhr.get(url, options);

		dataPromise.then(function(data) {
			if (data.content) {
				return data.content;
			}
			return data;
		}).then(dfd.resolve, dfd.reject);

		dfd.response = all({
			data : dataPromise,
			response : dataPromise.response
		}).then(function(result) {
			var data = result.data;
			var response = result.response;
			return {
				url : response.url,
				options : response.options,
				status : data.status || 200,
				getHeader : function(headerName) {
					if (data.headers && (headerName in data.headers)) {
						return data.headers[headerName];
					}
					return response.getHeader(headerName);
				}
			};
		});

		return dfd;
	}

	util.addCommonMethods(request);

	return request;
});
