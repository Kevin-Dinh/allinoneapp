/**
 * Use _this function if you require strict === in indexOf operation dojo array.indexOf is inconsistent with Array.prrototype.indexOf See
 * 
 */
define([
	"./_indexOf_mdc",
	"gjax/log/level"
], function(_indexOf_mdc, level) {

	// module:
	//		gjax/collections/indexOf

	/*=====
	return function(array, searchElement, fromIndex) {
		// summary:
		//		Cross-browser strict version of indexOf.
		//		Use to find and distingush falsy values (false, null, undefined).
		//		Use only when you don't need to search for NaN value.
		// array: Array
		//		Array for lookup.
		// searchElement: Any
		//		Element te search for.
		// fromIndex: Integer?
		//		The index at which to begin the search. Defaults to 0. 
		// returns: Integer
		//		Index of `searchElement` in `array`, if found, -1 otherwise.
		// description:
		//		This method corresponds to the native JavaScript 1.6 Array.indexOf method,
		//		unlike dojo/_base/array.indexOf (see http://bugs.dojotoolkit.org/ticket/16104).
		//		Also works in IE8< via MDN implementation 
		//		(https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf)
	};
	=====*/

	if (Array.prototype.indexOf) { //TODO: change for has() ? 

		level("debug", "gjax/collections") && console.debug("indexOf: using native, wrapped");

		return function(_this, searchElement, fromIndex) {
			return Array.prototype.indexOf.call(_this, searchElement, fromIndex);
		};
	} else {
		level("debug", "gjax/collections") && console.debug("indexOf: using MDN impl");
		return _indexOf_mdc;
	}
});