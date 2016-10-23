define([
	"gjax/encoders/_codePoint",
	"gjax/encoders/html/_namedEntities"
], function(_codePoint, namedEntities) {
	var REPLACE_CHAR = "xFFFD",

	entityNames = namedEntities.names, // sparse array of entity names
	entityRegexp = namedEntities.regexp, regexp = RegExp(
	// surrogate pair (sp)
	"([\uD800-\uDBFF][\uDC00-\uDFFF])" +
	// html UNUSED including standalone surrogates (un)
	"|([\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uD800-\uDFFF])" +
	// named entities (en)
	"|([" + entityRegexp + "])" +
	// out of ascii (oa)
	"|([^\u0000-\u007F])" +
	// big 5 (b5)
	"|([\u0022\u0026\u0027\u003C\u003E])", "g"), replacer = function(m, sp, un, en, oa, b5) {
		// extracted out from main function and ifs changed to ternary
		// thanks to Andrea Giammarchi
		var chc0 = m.charCodeAt(0);
		return "&" + (en ? entityNames[chc0] : "#" + (oa || b5 ? chc0 : (un ? REPLACE_CHAR : _codePoint.to(chc0, m.charCodeAt(1))))) + ";";
	};
	return function(s) {
		// summary:
		//		Use to encode strings for HTML. HTML entities are encoded using entity names.
		// description:
		//		 - replaces unused characters (C0, C1) and standalone surrogates by replace character (U+FFFD)
		//		 - encodes all HTML4 named entities (http://www.w3.org/TR/html4/sgml/entities.html) using their entity references
		//		 - keeps ASCII (except big5 - "&amp;'&lt;&gt;) unencoded
		//		 - encodes all the rest using decimal numeric character references (e.g. & -&gt; &#38;)
		// s: String
		//		String to encode.
		// returns:	String
		//		Encoded string.
		return s.replace(regexp, replacer);
	};
});
