define([], function() {
	return function(mode /*1==find, 0==findIndex*/) {
		return function(_this, predicate) {
			if (_this == null) {
				throw new TypeError('Array.prototype.' + (mode ? "find" : "findIndex") + ' called on null or undefined');
			}
			if (typeof predicate !== 'function') {
				throw new TypeError('predicate must be a function');
			}
			var list = Object(_this);
			var length = list.length >>> 0;
			var thisArg = arguments[1];
			var value;

			for ( var i = 0; i < length; i++) {
				value = list[i];
				if (predicate.call(thisArg, value, i, list)) {
					return mode ? value : i;
				}
			}
			return mode ? undefined : -1;
		};
	};
});