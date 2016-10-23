define([
	"dojo/has"
], function(has) {

	// STATUS: experimental, TODO: unit test and compare with dojo impl also for performance
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys

	has.add("es5-object-keys", function() {
		return !!Object.keys;
	});

	return has("es5-object-keys") ? Object.keys : (function() {
		'use strict';
		var _hasOwnProperty = Object.prototype.hasOwnProperty, hasDontEnumBug = !({
			toString : null
		}).propertyIsEnumerable('toString'), dontEnums = [
			'toString',
			'toLocaleString',
			'valueOf',
			'hasOwnProperty',
			'isPrototypeOf',
			'propertyIsEnumerable',
			'constructor'
		], dontEnumsLength = dontEnums.length;

		return function(obj) {
			if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
				throw new TypeError('Object.keys called on non-object');
			}
			var result = [], prop, i;
			for (prop in obj) {
				if (_hasOwnProperty.call(obj, prop)) {
					result.push(prop);
				}
			}
			if (hasDontEnumBug) {
				for (i = 0; i < dontEnumsLength; i++) {
					if (_hasOwnProperty.call(obj, dontEnums[i])) {
						result.push(dontEnums[i]);
					}
				}
			}
			return result;
		};
	}());

});
