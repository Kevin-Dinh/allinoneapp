define([
	"dojo/has",
	"./_find"
], function(has, _find) {
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex

	// use has to allow client code/test code to trrn on and off the native support 

	has.add("es6-array-findIndex", function() {
		return !!Array.prototype.findIndex;
	});

	if (has("es6-array-findIndex")) {
		return function(_this /*, predicate */) {
			return Array.prototype.findIndex.apply(_this, Array.prototype.slice.call(arguments, 1));
		};
	} else {//poly
		return _find(0);
	}
});
