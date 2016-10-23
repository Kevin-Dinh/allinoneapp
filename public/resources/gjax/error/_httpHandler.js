define([
	"dojo/json",
	"../error",
	"dojo/request/handlers"
], function(json, error, handlers) {

	//Add custom JSON handler, to provide better error stack
	handlers.register("json", function(response) {
		try {
			return json.parse(response.text || null);
		} catch (e) {
			if (e.name == "SyntaxError") {
				var m = "Content of response (with status '" + response.status + "') could not be parsed as JSON";
				//create the Error with message, so it is correctly displayed also in stack
				throw error.newError(new SyntaxError(m), m, e, "gjax/error/_handleHttpError", "SyntaxError");
			}
			throw e;
		}
	});

	var _this = {
		handle : function(err) {
			// summary:
			//		Handler that processes and wraps HTTP errors
			throw _this._handle(err);
		},
		_handle : function(err) {
			// summary:
			//		Abstract. Called by handle().
			//		Override on application level
			return err;
		},

		_wrap : function(err, msg, newName) {
			var wrappedErr = error.newUserError(err, msg, null, "gjax/error/_handleHttpError", newName);
			if (err.response) {
				//add information that will not be availible after serialization
				wrappedErr.url = err.response.url;
				wrappedErr.status = err.response.status;
			}
			return wrappedErr;
		},
		_getJsonContent : function(err) {
			if (err.jsonContent) {
				return err.jsonContent;
			}
			try {
				var ct = err.response.getHeader("Content-Type");
				if (ct && ct.indexOf("application/json") === 0) {
					return json.parse(err.responseText || err.response.text);
				}
				return null;
			} catch (e) {
				return null;
			}
		}
	};

	return _this;
});
