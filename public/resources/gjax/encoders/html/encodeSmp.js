define([
	"gjax/encoders/_codePoint"
], function(_codePoint) {
	var REPLACE_CHAR = "xFFFD", regexp = RegExp(
	// surrogate pair (sp)
	"([\uD800-\uDBFF][\uDC00-\uDFFF])" +
	// html UNUSED including standalone surrogates (un)
	"|([\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uD800-\uDFFF])" +
	// out of ascii (oa)
	"|([^\u0000-\u007F])" +
	// big 5 (b5)
	"|([\u0022\u0026\u0027\u003C\u003E])", "g"), replacer = function(m, sp, un, oa, b5) {
		// extracted out from main function and ifs changed to ternary
		// thanks to Andrea Giammarchi
		var chc0 = m.charCodeAt(0);
		return "&#" + (oa || b5 ? chc0 : (un ? REPLACE_CHAR : _codePoint.to(chc0, m.charCodeAt(1)))) + ";";
	};
	return function(s) {
		// summary:
		//		Use to encode strings for HTML.
		// description:
		//
		//		 - replaces unused characters (C0, C1) and standalone surrogates by replace character (U+FFFD)
		//		 - keeps ASCII (except big5 - "&'<>) unencoded
		//		 - encodes all the rest using decimal numeric character references (e.g. & -> &#38;)
		//
		// s: String
		//		String to encode. null/undefined treated as empty string, any other non-string value will be converted to string.
		// returns:	String
		//		Encoded string.
		return s == null ? "" : //undefined and null treated as "" now 
		("" + s).replace(regexp, replacer); // cast to string
	};
});
