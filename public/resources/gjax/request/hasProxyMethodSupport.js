define(function() {
	// summary:
	//		makes few HTTP requests and checks if 'network proxy' blocks some of the methods.
	//		use this module to detect method pass, or confgure in your app
	//		request module then can add X-method-override or other trick to make DELETE, PUT or other 
	//		possibly banned methods.
	// description:
	//		Corporate proxies are paranoid...

	return {

		load : function(serviceUri, require, callback) {
			require([
				"dojo/has",
				"dojo/request/registry",
				"gjax/uri/Uri",
				"dojo/promise/all",
				"dojo/_base/array"
			], function(has, request, Uri, all, darray) {

				// some service that supports all methods
				var service = serviceUri || Uri.resolveSvcCtx("/app/svc/ping"); // TODO: parametrize, config

				all(darray.map([
					"PUT",
					"DELETE",
					"PATCH"
				], configuredOrDetected))//
				.then(callback);

				// ---------------------------------------------------------------------------------------------------
				function configuredOrDetected(method) {
					// returns: valueOrPromise (undefined value means configured, promise means by detector)
					var feature = "request-method-support-" + method;
					// set already from config or elsewhere or run detector and set has(feature)
					if (has(feature) === undefined) {
						return detect(method).then(function(detectedValue) {
							has.add(feature, detectedValue);
						});
					}
				}
				function detect(method) {
					//FIXME: check status ? 200 expected and empty JSON as payload
					return request(service, {
						method : method,
						handleAs : "json"
					}).then(function() {
						return true;
					}, function(e) {
						console.error(e);
						return false;
					});
				}
			});

		}
	};

});