define([
// not directly dependent on .throw.js
// "static methods"
//STABILITY: stable
], function() {
	
	// summary:
	//		Checker functions, to check if the error contains certain information.
	
	function hasNumber(ex, number) {
		// summary:
		//		Checks if "error chain" contains error with specific number.
		//		Useful specially to capture MSIE specific errors, since MSIE uses numbers often.
		// ex: Error
		//		Error to inspect, usually a caught exception to analyze
		// number: int
		//		Number to check
		// returns:	Object
		//		returns error with user message if found ("truthy value") 
		//		or undefined ("falsy value") if chain does not contain error with specific number.
		return _find(ex, {
			number : number
		});
	}
	function hasName(ex, name) {
		// summary:
		//		Checks if "error chain" contains error with specific "name".
		//		Useful specially to capture application level messages that can/shall be distinguished by names.
		// ex: Error
		//		Error to inspect, usually a caught exception to analyze
		// name: String
		//		Name to search for
		// returns:	Object
		//		returns error with user message if found ("truthy value") 
		//		or undefined ("falsy value") if chain does not contain error with specific name.
		return _find(ex, {
			name : name
		});
	}
	function isUser(ex) {
		// summary:
		//		Checks if "error chain" contains "user error".
		// ex: Error
		//		Usually a caught exception to analyze
		// returns:	Object
		//		returns error with user message if found ("truthy value") 
		//		or undefined ("falsy value") if chain has no user error inside.
		return _find(ex, {
			isUserMsg : true
		});
	}
	/**
	 * @returns all user messages in chain delimited by CRLF
	 */
	function getUserMsg(ex, bDoNotExpand) {
		// summary:
		//		Collected "user messages" from all "user errors" in chain.
		// ex: Error
		//		Usually a caught exception to analyze
		// returns:	String
		//		CRLF delimited list of messages or ""
		var r = [], e = ex;
		do {
			//assumption: each isUser has message
			if (e.isUserMsg) {
				// if not and undefined, search bug elsewhere
				r.push(e.message);
			}
		} while ((e = e.origError) != null && !bDoNotExpand);

		return r.join("\r\n");
	}
	function _find(ex, query) {

		var e = ex;
		Outer: do {
			for ( var p in query) {
				if (query[p] != e[p]) {
					continue Outer;					
				}
			}
			return e;
		} while ((e = e.origError) != null);
	}
	//-----------------------------------------------
	return {
		hasNumber : hasNumber,
		hasName : hasName,
		isUser : isUser,
		getUserMsg : getUserMsg
	};

});