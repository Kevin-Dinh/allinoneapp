/*jshint curly:false*/ //ported from elsewhere
define([], function() {
	return function(_this, searchElement, i) {
		var j;
		for (j = _this.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; i < j && _this[i] !== searchElement; i++)
			;
		return j <= i ? -1 : i;
	};
});

