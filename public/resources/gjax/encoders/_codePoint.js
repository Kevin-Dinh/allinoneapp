define([], function() {

	function toCodePoint(high, low) {
		return ((high - 0xD800) << 10) + (low - 0xDC00) + 0x10000;
	}

	function fromCodePoint(codePt) {
		return codePt <= 0xFFFF ? String.fromCharCode(codePt) : String.fromCharCode(0xD800 + (codePt - 0x10000 >> 10), 0xDC00 + (codePt - 0x10000 & 0x3FF));
	}

	return {
		from : fromCodePoint,
		to : toCodePoint
	};
});
