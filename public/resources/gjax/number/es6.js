define([], function() {
	// summary:
	//		Mustly polyfills for ES6 functions and maybe few extensions
	// description:
	//		see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
	// example:
	//		
	//		
	var _this = {

		MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1, // 9007199254740991
		MIN_SAFE_INTEGER : Number.MIN_SAFE_INTEGER || -(Math.pow(2, 53) - 1), // -9007199254740991

		isInteger : Number.isInteger = Number.isInteger || function(value) {
			// summary: see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
			return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
		},
		isSafeInteger : Number.isSafeInteger || function(value) {
			return _this.isInteger(value) && _this.MIN_SAFE_INTEGER <= value && value <= _this.MAX_SAFE_INTEGER;
		}
	};
	return _this;
});