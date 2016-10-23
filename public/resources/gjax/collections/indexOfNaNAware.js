define([
	"./indexOf"
], function(indexOf) {
	
	// module:
	//		gjax/collections/indexOfNaNAware
	
	return function(array, searchElement, fromIndex) {
		// summary:
		//		Cross-browser strict version of indexOf.
		//		Use to find and distingush NaN and also falsy values (false, null, undefined).
		// array: Array
		//		Array for lookup.
		// searchElement: Any
		//		Element te search for.
		// fromIndex: Integer?
		//		The index at which to begin the search. Defaults to 0. 
		// returns: Integer
		//		Index of `searchElement` in `array`, if found, -1 otherwise.
		// description:
		//		This method corresponds to the JavaScript 1.6 Array.indexOf method. 
		//		It also properly searches for NaN values.
		
		if (searchElement != searchElement) { // special handling for NaN
			/*jshint curly:false*/
			for (var i = array.length; i-- && array[i] == array[i];);
			return i;
		} else {
			return indexOf(array, searchElement, fromIndex);
		}	
	};

});