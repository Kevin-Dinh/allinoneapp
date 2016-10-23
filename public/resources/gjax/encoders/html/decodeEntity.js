define([
	"gjax/encoders/_codePoint",
	"gjax/encoders/html/_namedEntities"
], function(_codePoint, namedEntities) {

	var REPLACE_CHAR = "xFFFD", entityCodes = namedEntities.codes, // sparse array of entity names
	regexp = RegExp(
	// decimal code (dec)
	"&#([0-9]+);" +
	// hexadecimal code (hex)
	"|&#(x[0-9a-fA-F]+);" +
	// named entity (ent)
	"|&(\\w+);", "g"), replacer = function(m, dec, hex, ent) {
		return _codePoint.from(dec || (ent && (entityCodes[ent] || "0" + REPLACE_CHAR)) || "0" + hex);
	};
	return function(s) {
		// summary:
		//		Use to decode strings from HTML. Also decodes HTML entities.
		// s: String
		//		String to decode.
		// returns:	String
		//		Decoded string.
		return s.replace(regexp, replacer);
	};
});
