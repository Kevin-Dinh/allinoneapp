define([
	"dojo/string",
	"gjax/uri",
	// REVIEW: is this correct library ?, 
	// or shall we use encoders from URI ? 
	// not using gjax/io-query by purpose, does not encode ampersand and is not well documented
	"dojo/io-query",
	"gjax/_base/kernel",
	"dojo/_base/lang"
], function(string, uri, ioQuery, gkernel, lang) {
	// summary:
	//		Build URLs safel
	// description:
	//      Mix of dojo string templating and URI decomposition, composition and encoding.
	//		Decompose uri template to uri parts, replace {} in each part and 
	//		encode with apriopriate path, query or fragment encoders 
	//		(or custom encoders provided in 3rd options param),
	//		then recompose components back
	//		
	//		CURRENTLY NOT USABLE FOR PROTOCOL+HOST as one string
	//		do not try this "${CTX}/path/" this will not work
	// example:
	//		TODO: example 

	function EncodedString(encoded, string) {
		// represents String with encoded flag, 
		// new Class to be able to make instanceOf could be also new String() + ._enc, but this seems cleaner
		// needed by substritute function to know if encode or not
		this.encoded = encoded;
		this.string = string;
	}

	function encode(data, encoder) {
		// wrapper around uri.encodeUri, sometimes it encodes sometimes it does not
		if (typeof data === "string") {
			return encoder(data);
		} else if (data instanceof EncodedString) { //special value from some formatters
			return data.encoded ? data.string : encoder(data.string);
		} else {
			gkernel.asrt(0, "Expected string, convert or use ${param:format}");
		}
	}

	var ENCODERS = {
		segment : function(data) {
			return encode(data, uri.encodeSegment);
		},
		fragment : function(data) {
			return encode(data, uri.encodeFragment);
		},
		query : function(data) {
			return encode(data, uri.encodeQuery);
		}
	};

	var FORMATTERS = {
		objectToQuery : function(value /*, key */) {
			// returns String with flag that it is already encoded
			return new EncodedString(true, ioQuery.objectToQuery(value));
		},
		raw : function(value /*, key */) {
			console.log(typeof value);
			console.log(value);
			return new EncodedString(true, value);
		},
		string : function(value /*, key */) {
			//do not format null or undefined, to achieve same bahaviour as substitute - error
			return value == null ? value : value + "";
		}
	};

	function build(template, param, encoders, formatters) {

		// process each part separately
		var u = uri.decomposeComponents(template);
		// each part shall have different encoder and may have different supported formatters as well
		//console.log(u);
		u.path && (u.path = string.substitute(u.path, param, encoders.segment, formatters));
		u.query && (u.query = string.substitute(u.query, param, encoders.query, formatters));
		u.fragment && (u.fragment = string.substitute(u.fragment, param, encoders.fragment, formatters));
		return uri.recomposeComponents(u);
	}

	function builder(template, param) {
		return build(template, param, ENCODERS, FORMATTERS);
	}

	lang.mixin(builder, {
		_build : build,
		_encoders : ENCODERS,
		_formatters : FORMATTERS,
		_encode : encode
	});

	return builder;
});