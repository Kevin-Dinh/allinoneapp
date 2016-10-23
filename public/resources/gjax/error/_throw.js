/**
 * Base error object, structure and create functions
 */
define([
	"dojo/json" //custom exception stack for window.onerror handler
], function(json) {

	var _this = {

		newError : function(errBase, message, origError, source, numberOrClass) {
			// summary:
			//		Use to throw new error (technical). Not meant to be displayed to user.
			// errBase: Error
			//		always use "new Error()", (XB: needed because FF error line numbering)
			// message: String
			//		technical message
			// origError: Error?
			//		equivalent of innerException (in Java)
			// source: String?
			//		Meaningfull identification of error source (e.g. "module.objectClass[instance?].method")
			// numberOrClass: int? | String?
			//		Name or number given to exception to distinguish from others in later error handling.
			// returns:	Error
			//		New error object with specified additional properties
			return this._newError(errBase, message, origError, source, numberOrClass, false);
		},
		newUserError : function(errBase, message, origError, source, numberOrClass) {
			// summary:
			//		Use to throw new user error, to be displayed to user.
			// errBase: Error
			//		always use "new Error()", (XB: needed because FF error line numbering)
			// message: String
			//		Localized user targeted message.
			// origError: Error?
			//		equivalent of innerException (in Java)
			// source: String?
			//		Meaningfull identification of error source (e.g. "module.objectClass[instance?].method")
			// numberOrClass: int? | String?
			//		Name or number given to exception to distinguish from others in later error handling.
			// returns:	Error
			//		New error object with specified additional properties
			return this._newError(errBase, message, origError, source, numberOrClass, true);
		},
		/**
		 * @param errBase
		 *            always use new Error(), needed because of FF
		 * @param numberOrClass
		 *            use number if your application relises on number codes, or String if error names are used in your error handling
		 *
		 */
		_newError : function(errBase, message, origError, source, numberOrClass, isUserMsg) {
			var useNumber = (typeof numberOrClass == "number");
			var useClass = (typeof numberOrClass == "string");
			var e = errBase;
			e.name = useClass ? numberOrClass : "GjaxError";
			e.number = useNumber ? numberOrClass : -1;
			e.source = source; //TODO: check conflict with default browser props.
			e.message = message;
			e.isGjax = true; // flag gjax exceptions to be rocognizable, flags that this exception has extended gjax description
			e.origError = this._serializeOrigError(origError); //use this. to allow override
			e.isUserMsg = !!isUserMsg;
			e.hasUserMsgs = e.isUserMsg; // flag if any nested error contains user message
			var desc = this._serialize(e);
			e.description = desc; // because of unhandled errors ending in window.error
			return e;
		},
		_serialize : function(e) {
			return json.stringify(e, null, "\t");
		},
		_serializeOrigError : function(e) {
			return e;
		},
		_deserialize : function(e) {
			return json.parse(e.desc);
		}
	};
	return _this;

});
