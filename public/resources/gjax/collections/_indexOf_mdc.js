define([], function() {
	
	return function(/*Array*/_this, /*Any*/searchElement/*, fromIndex*/) {		
		// summary:
		//		XB version of indexOf function. Original MDC code.
		// description:
		//		See: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
		
		//"use strict";
		
		if (_this == null) {
			throw new TypeError();
		}

		var t = Object(_this);
		var len = t.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = 0;
		if (arguments.length > 2) {
			n = Number(arguments[2]);
			if (n != n) { // shortcut for verifying if it's NaN
				n = 0;
			} else if (n !== 0 && n != Infinity && n != -Infinity) {
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
			}
		}
		if (n >= len) {
			return -1;
		}
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for (; k < len; k++) {
			if (k in t && t[k] === searchElement) {
				return k;
			}
		}
		return -1;
	};
});