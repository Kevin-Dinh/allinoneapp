define([
	"require",
	"doh/main",
	"dojo/_base/lang",
	"gjax/uri/Uri",
	//tested libraries
	"gjax/store/JsonRest",
	"dojo/promise/all"
], function(require, doh, lang, Uri, JsonRest, all) {

	function UNEXPECTED_SUCCESS() {
		throw new Error("Succes unexpected.");
	}

	var testObject = {
		"Test get" : function() {
			var store = new JsonRest({
				target : Uri.resolve(null, require.toUrl("./_mocks/")),
				idProperty : "id"
			});

			return store.get("node1.1.json")//
			.then(function(object) {
				doh.is(object.name, "node1.1");
				doh.is(object.someProperty, "somePropertyA1");
			});
		},
		"Test correct method and url when creating new item without ID" : function() {
			var store = new JsonRest({
				target : "/foo/"
			});
			return store.add({
				foo : "bar"
			})//
			.then(UNEXPECTED_SUCCESS, function(err) {
				doh.is("/foo/", err.response.url);
				doh.is("POST", err.response.options.method);
			});
		},
		"Test correct method, url & data when creating new item with ID" : function() {
			var store = new JsonRest({
				target : "/foo/",
				sendIdProperty : false
			});
			return store.add({
				id : "testId",
				foo : "bar"
			})//
			.then(UNEXPECTED_SUCCESS, function(err) {
				doh.is("/foo/testId", err.response.url);
				doh.is("PUT", err.response.options.method);
				doh.t(/bar/.test(err.response.options.data), "bar should be in request data");
				doh.f(/testId/.test(err.response.options.data), "testId should not be in request data");
			});
		},
		"Test correct method, url & data when creating new item with ID & sendIdProperty" : function() {
			var store = new JsonRest({
				target : "/foo/",
				sendIdProperty : true
			});
			return store.add({
				id : "testId",
				foo : "bar"
			})//
			.then(UNEXPECTED_SUCCESS, function(err) {
				doh.is("/foo/testId", err.response.url);
				doh.is("PUT", err.response.options.method);
				doh.t(/bar/.test(err.response.options.data), "bar should be in request data");
				doh.t(/testId/.test(err.response.options.data), "testId should be in request data");
			});
		},
		"Test headers" : function() {
//			var d = new doh.Deferred(), error, expected = 0, received = 0;

			return all([
				runTest("get", "testId"),
				runTest("query", ""),
				runTest("remove", "testId"),
				runTest("put", {
					id : "testId"
				}),
				runTest("add", {
					id : "testId"
				})
			]);

			// NOTE: Because HTTP headers are case-insensitive they should always be provided as all-lowercase
			// strings to simplify testing.
			function runTest(method, param) {
				var globalHeaders = {
					"test-global-header-a" : true,
					"test-global-header-b" : "yes"
				};
				var requestHeaders = {
					"test-local-header-a" : true,
					"test-local-header-b" : "yes",
					"test-override" : "overridden"
				};

				var store = new JsonRest({
					target : "/foo/",
					headers : lang.mixin({
						"test-override" : false
					}, globalHeaders),
					idProperty : "id"
				});

				return store[method](param, {
					headers : requestHeaders
				})//
				.then(UNEXPECTED_SUCCESS, function(err) {
					var outgoingHeaders = err.response.options.headers;
					var k;
					for (k in requestHeaders) {
						doh.t(outgoingHeaders.hasOwnProperty(k), "requestHeader missing : " + k);
						doh.is("" + requestHeaders[k], "" + outgoingHeaders[k], "requestHeader mismatch");
					}

					for (k in globalHeaders) {
						doh.t(outgoingHeaders.hasOwnProperty(k), "globalHeaders missing : " + k);
						doh.is("" + globalHeaders[k], "" + outgoingHeaders[k], "globalHeaders mismatch");
					}
				});
			}
		}
	};

	doh.register("gjax/store/JsonRest", testObject);
});
