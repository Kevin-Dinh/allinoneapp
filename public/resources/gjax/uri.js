/*jshint curly:false*///ported from elsewhere
/*jshint -W041 */
//TODO: document encoded and raw behavior
/**
 * This module origibate in times when JS implementations did not exist or have been of buggy quality
 * 
 * See also links in teh code for inspiration and old/new impls
 * 	
 */
define([], function() {
	/**
		 RFC3986 for JavaScript
		 @author: marcus
	
		 Credits to:
		 -------------------------
		 1.	uri_funcs.js - URI functions based on STD 66 / RFC 3986  Author (original): Mike J. Brown <mike at skew.org>  Version: 2007-01-04
		 2.	http://jena.sourceforge.net/iri/javadoc/index.html
		 -------------------------
	 **/
	/**
		 regexp explained:
		 (						//1		has scheme
		 ([^:/?#]*)			//2		scheme
		 :)?
		 (						// 3	has authority
		 (					// 4	authority
		 (				// 5	has user
		 ([^/?#@]*)@ // 6	user
		 )?
		 (\\[[^/?#]*\\]|	//7		host
		 ([^/?#:]*)	//8		(a "form of host")
		 )?
		 (:				//9		has port
		 ([^/?#]*)	//10	port
		 )?
		 )
		 )?
		 ([^#?]*)?				//11	path
		 (\\?					//12	has query
		 ([^#]*)				//13	query
		 )?
		 (#						//14	has fragment
		 (.*)				//15	fragment
		 )?
	 **/
	var splitUriRegex = new RegExp(//IRI lib regexp
	"^" + "(([^:/?#]*):)?" + // scheme
	"(//((([^/?#@]*)@)?" + // user
	"(\\[[^/?#]*\\]|([^/?#:]*))?" + // host
	"(:([^/?#]*))?))?" + // port
	"([^#?]*)?" + // path
	"(\\?([^#]*))?" + // query
	"(#(.*))?" + // frag
	"$"), //
	// TODO: get rid of RFC2396 constants
	RFC2396_DIGIT = "0-9", // 
	RFC2396_LOWALPHA = "a-z", //
	RFC2396_UPALPHA = "A-Z", //
	RFC2396_ALPHA = RFC2396_LOWALPHA + RFC2396_UPALPHA, //
	RFC2396_ALPHANUM = RFC2396_DIGIT + RFC2396_ALPHA, //
	RFC3986_UNRESERVED = RFC2396_ALPHANUM + "\u002d\u002e\u005f\u007e", /* "-._~" */
	RFC3986_SUBDELIMS = "\u0021\u0024\u0026\u0027\u0028\u0029\u002a\u002b\u002c\u003b\u003d", /* "!$&'()*+,;=" */
	RFC3986_PCT_ENCODED = "", //
	//RFC3986_REG_NAME = RFC3986_UNRESERVED + RFC3986_PCT_ENCODED + RFC3986_SUBDELIMS, 
	RFC3986_PCHAR = RFC3986_UNRESERVED + RFC3986_PCT_ENCODED + RFC3986_SUBDELIMS + "\u003a\u0040", /* ":@" */
	RFC3986_SEGMENT = RFC3986_PCHAR, //
	RFC3986_PATH_SEGMENTS = RFC3986_SEGMENT + "\u002f", /* "/" */
	RFC3986_QUERY = RFC3986_PCHAR + "\u003f\u002f", /* "?/" */
	RFC3986_FRAGMENT = RFC3986_PCHAR + "\u003f\u002f", /* "?/" */

	PCHAR_TOKENIZER = /(?:%[0-9A-Fa-f]{2}){1,}|./g, //

	// this is not enough for FF
	// (FF returns undefined where others return "" [7,11 fields])
	undef, reMissingGroupSupport = (typeof "".match(/(a)?/)[1] != "string");
	/**
	 @see Appendix B.  Parsing a URI Reference with a Regular Expression

	 raw regexp parsing and matching
	 should correctly return
	 "" vs. undefined on uri parts
	 "" vs. undefined on authority parts when authority undefined vs. ""
	 **/
	function decomposeComponents(uriStr) {
		/*jshint maxcomplexity:50 */
		//ported 
		var gs = uriStr.match(splitUriRegex), u = {
			scheme : gs[2],
			authority : gs[4],
			path : gs[11],
			query : gs[13],
			fragment : gs[15],
			userInfo : undef,
			host : undef,
			port : undef
		//TODO: maybe do not add if authority is not defined
		};
		if (!reMissingGroupSupport) {
			if (gs[1] == "")
				u.scheme = undef;
			if (gs[3] == "")
				u.authority = undef;
			if (gs[12] == "")
				u.query = undef;
			if (gs[14] == "")
				u.fragment = undef;
		} else if (u.path == null)
			u.path = "";
		//FF fix

		if (u.authority != null) {
			// TODO: host null vs "" if authority defined but host not ?
			u.userInfo = gs[6];
			u.host = gs[7], u.port = gs[10];
			if (!reMissingGroupSupport) {
				if (gs[5] == "")
					u.userInfo = undef;
				if (gs[9] == "")
					u.port = undef;
			} else if (u.host == null)
				u.host = "";
			//FF fix
		}
		return u;
	}

	/**
	 @see 5.3.  Component Recomposition  . . . . . . . . . . . . . . . . 35
	 Remarks:
	 defined(x) is coded with !=null (means undefined and null are handled the same way)
	 ignores "authority sub components"
	 **/
	function recomposeComponents(uriObj) {
		_checkAuthorityInvariant(uriObj);
		var result = "", u = uriObj;
		if (u.scheme != null)
			result += u.scheme + ":";
		if (u.authority != null)
			result += "//" + u.authority;
		result += u.path;
		if (u.query != null)
			result += "?" + u.query;
		if (u.fragment != null)
			result += "#" + u.fragment;
		return result;
	}

	function recomposeAuthorityComponents(userInfo, host, port) {
		if (host == null)
			throw new Error("Illegal host:" + host);
		var result = "";
		if (userInfo != null)
			result += userInfo + "@";
		result += host;
		if (port != null)
			result += ":" + port;
		return result;
	}

	function _checkAuthorityInvariant(uriObj) {
		/*jshint laxbreak:true*/
		var b = (uriObj.authority == null && uriObj.userInfo == null && uriObj.host == null & uriObj.port == null)
				|| (uriObj.authority != null && uriObj.authority == recomposeAuthorityComponents(uriObj.userInfo, uriObj.host, uriObj.port));
		if (!b)
			throw new Error("IllegalStateException,AuthorityInvariant broken");
	}

	function resolve(base, ref) {
		_preParseBaseUri(base);
		return _transformReference(base, ref);
	}

	/**
	 5.2.1.  Pre-parse the Base URI
	 **/
	function _preParseBaseUri(base) {
		if (base.scheme == null)
			throw new Error("Violation 5.2.1, scheme component required");
	}

	/**
	 5.2.2.  Transform References
	 **/
	var STRICT_TRANSFORMREFERENCES = true;
	function _transformReference(base, ref) {
		var t = {}, r = ref;
		if (!STRICT_TRANSFORMREFERENCES && r.scheme == base.scheme) {
			r.scheme = undef;
		}
		if (r.scheme != null) { //TODO: mixin ?
			t.scheme = r.scheme;
			t.authority = r.authority;
			t.userInfo = r.userInfo;
			t.host = r.host;
			t.port = r.port;
			t.path = removeDotSegments(r.path);
			t.query = r.query;
		} else {
			if (r.authority != null) {
				t.authority = r.authority;
				t.userInfo = r.userInfo;
				t.host = r.host;
				t.port = r.port;
				t.path = removeDotSegments(r.path);
				t.query = r.query;
			} else {
				if (r.path === "") {
					t.path = base.path;
					if (r.query != null)
						t.query = r.query;
					else
						t.query = base.query;
				} else {
					if (r.path.charAt(0) == "/") {
						t.path = removeDotSegments(r.path);
					} else {
						t.path = _merge(base, r.path);
						t.path = removeDotSegments(t.path);
					}
					t.query = r.query;
				}
				t.authority = base.authority;
				t.userInfo = base.userInfo;
				t.host = base.host;
				t.port = base.port;
			}
			t.scheme = base.scheme;
		}
		t.fragment = r.fragment;
		return t;
	}

	/**
	 5.2.3.  Merge Paths
	 **/
	function _merge(base, refPath)//object,string
	{
		if (base.authority != null && base.path === "") {
			return "/" + refPath;
		} else {
			var xi = base.path.lastIndexOf("/");
			if (xi == -1)
				return refPath;
			else
				return base.path.substring(0, xi + 1) + refPath;
		}
	}

	/** from IRI com.hp.hpl.jena.iri.impl.AbsIriImp **/
	function removeDotSegments(path) {
		/*jshint maxcomplexity:50 *///ported
		// 5.2.4 step 1.
		var inputBufferStart = 0, inputBufferEnd = path.length, output = "", xi, _in, nextSlash;
		// 5.2.4 step 2.
		while (inputBufferStart < inputBufferEnd) {
			_in = path.substring(inputBufferStart);
			// 5.2.4 step 2A
			if (_in.indexOf("./") === 0) {
				inputBufferStart += 2;
				continue;
			}
			if (_in.indexOf("../") === 0) {
				inputBufferStart += 3;
				continue;
			}
			// 5.2.4 2 B.
			if (_in.indexOf("/./") === 0) {
				inputBufferStart += 2;
				continue;
			}
			if (_in == "/.") {
				_in = "/";
				// don't continue, process below.
				inputBufferStart += 2;
				// force end of loop
			}
			// 5.2.4 2 C.
			if (_in.indexOf("/../") === 0) {
				inputBufferStart += 3;
				xi = output.lastIndexOf("/");
				if (xi != -1 && xi != output.length)
					output = output.substring(0, xi);
				continue;
			}
			if (_in == "/..") {
				_in = "/";
				// don't continue, process below.
				inputBufferStart += 3;
				// force end of loop
				xi = output.lastIndexOf("/");
				if (xi != -1 && xi != output.length)
					output = output.substring(0, xi);
			}
			// 5.2.4 2 D.
			if (_in == ".") {
				inputBufferStart += 1;
				continue;
			}
			if (_in == "..") {
				inputBufferStart += 2;
				continue;
			}
			// 5.2.4 2 E.
			nextSlash = _in.indexOf('/', 1);
			if (nextSlash == -1)
				nextSlash = _in.length;
			inputBufferStart += nextSlash;
			output += (_in.substring(0, nextSlash));
		}
		// 5.2.4 3
		return output;
	}

	/**
	 TODO: percentEncode, change safeChars definitions, they are buggy !!!
	 % is not encoded by
	 TODO: nicer version available here: Gjax.WebComponents\gjaxXB\EscapeUtils\Basic.js
	 **/
	function percentEncode(str, legalRange) {

		var retVal = "", reLegal = legalRange != null ? new RegExp("[" + legalRange + "]") : null, i, enc, c;
		/**
		 should not be char api ! (because of Secondary Multilingual Plane)
		 safeChars should not contain high or low surogate values
		 Glyph from that plane means two chars,
		 I will rely on correct safeChars
		 I will not include Character API here to minimize dependencies
		 **/
		for (i = 0; i < str.length; i++) {//TODO: change to glyphs
			c = str.charAt(i);
			if (reLegal == null || !c.match(reLegal)) {
				//should encode all non ASCII and system and SMP etc...
				//THIS IS NOT VALID ! encodeURIComponent(SMPString)==encodeURIComponent(SMPString[0])+encodeURIComponent(SMPString[1])
				try {
					enc = encodeURIComponent(str.charAt(i));
					//encodeURIComponent(HIGH surogate) fails
				} catch (ex) {
					//TODO: mega naive (still trying to avoid Character.js dependency ?)
					enc = encodeURIComponent(str.charAt(i) + str.charAt(i + 1));
					i++;
				}
				if (enc.length == 1) {//was not encoded by system, I EXPECT THAT IT IS ASCII !!!
					enc = ("%" + (str.charCodeAt(i)).toString(16).toUpperCase());
				}
				retVal += enc;
			} else
				retVal += c;
		}
		return retVal;
	}

	function decodeSegments(encodedPath) {
		// summary:
		//		Spliting path by "/".
		// 		Main reason is to eliminate unambiquity of
		// 		"/a%2f%b/c" and "/a/b/c".
		// encodedPath: String
		//		Encoded path
		// returns:	String[]
		//		Path split to DECODED segments, as array
		if (encodedPath === "")
			return [];
		var i, segments = encodedPath.split("/");
		if (segments.shift() !== "")
			throw new Error("path-abempty expected");
		for (i = 0; i < segments.length; i++) {
			segments[i] = decodeURIComponent(segments[i]);
		}
		return segments;
	}

	function encodeSegments(segments) {
		// summary:
		//		Joining path segments by /
		// 		Main reason is to eliminate unambiquity of
		// 		"/a%2f%b/c" and "/a/b/c"
		// segments: String[] 
		//		array of segments not encoded
		// returns:	String
		//		path-abempty, ENCODED path, only characters specified in RFC3986_SEGMENT are encoded
		//		if [] specified "" is returned	
		if (!(segments instanceof Array)) {
			throw new Error("IllegalArgumentException, array of segments expected");
		}
		if (segments.length === 0) {
			return "";
		}
		for ( var i = 0; i < segments.length; i++) {
			segments[i] = percentEncode(segments[i], RFC3986_SEGMENT);
		}
		return "/" + segments.join("/");
	}

	function encodeSegment(segment) {
		return percentEncode(segment, RFC3986_SEGMENT);
	}

	function encodeQuery(str) {
		return percentEncode(str, RFC3986_QUERY);
	}

	function encodeFragment(str) {
		return percentEncode(str, RFC3986_FRAGMENT);
	}

	function checkEncoding(raw, legalRange, doThrow/*, flags*/) {
		// summary:
		//		Validates if string contains legalRange + valid pchars PCHAR.
		//		PCHARS represent valid UTF-8 sequence.
		// returns:	Error?
		//		Null if ok, Error if failed

		// TODO: flags: ILLEGAL_PERCENT_ENCODING, SUPERFLUOUS_ASCII_PERCENT_ENCODING, PERCENT_ENCODING_SHOULD_BE_UPPERCASE, SUPERFLUOUS_NON_ASCII_PERCENT_ENCODING
		if (!raw)
			return null;
		var reLegal = new RegExp("[" + legalRange + "]"), tokens = raw.match(PCHAR_TOKENIZER), i, e, t;
		for (i = 0; i < tokens.length; i++) {
			t = tokens[i];
			if (t.length > 1) {
				try {
					decodeURIComponent(t);
				} catch (ex) {
					e = new Error("Illegal PCHAR sequence:" + t);
					if (doThrow)
						throw e;
					return e;
				}
			} else if (!t.match(reLegal)) {
				e = new Error("Illegal PCHAR sequence:" + t);
				if (doThrow)
					throw e;
				return e;
			}
		}
		return null;
	}

	function checkSegmentsEncoding(str, doThrow) {
		return checkEncoding(str, RFC3986_PATH_SEGMENTS, doThrow);
	}

	function checkSegmentEncoding(str, doThrow) {
		return checkEncoding(str, RFC3986_SEGMENT, doThrow);
	}

	function checkQueryEncoding(str, doThrow) {
		return checkEncoding(str, RFC3986_QUERY, doThrow);
	}

	function checkFragmentEncoding(str, doThrow) {
		return checkEncoding(str, RFC3986_FRAGMENT, doThrow);
	}

	// extensions
	function parseQuery(query, bDecode) {
		// summary:
		//		Striktna varianta rozoznavajuca empty a undefined query.
		// query: String
		//		Ak undefined alebo null vracia null. Ak "" vracia {}, inak vracia {p1:v1,ps:[]},
		//		ocakavane bez delimitera (?,#) teda z naseho API
		// bDecode: Booelan
		//		Default false, ci dekodovat mena a values
		// returns:	Object
		if (query == null)
			return null;
		if (query === "")
			return {};
		var ret = {}, parts = query.split("&"), i, ps, name, val;
		for (i = 0; i < parts.length; i++) {
			ps = parts[i].split("=");
			name = bDecode ? decodeURIComponent(ps[0]) : ps[0];
			val = bDecode ? decodeURIComponent(ps[1]) : ps[1];
			if (ret[name] != null) {
				if (ret[name] instanceof Array) {
					ret[name].push(val);
				} else {
					ret[name] = [
						ret[name]
					].concat(val);
				}
			} else {
				ret[name] = val;
			}
		}
		return ret;
	}

	function isSubordinate(uriParent, uriSub, orSame) {
		// if subordinate is absolute and parent is not or parent has different authority
		if (uriSub.authority != null && uriSub.authority != uriParent.authority)
			return false;
		var i = uriSub.path.indexOf(uriParent.path);
		return i === 0 && (orSame || uriSub.path.length != uriParent.path.length);
	}

	//		function relativize(uri, uri) { //TODO:
	//			//BUT first we need to agree on the specification, what is relativize (do some research please)
	//		}
	// 		see also: 
	//		https: //github.com/mjb2010/URI/blob/master/uris.js
	// 		http://medialize.github.io/URI.js/docs.html#relativeto
	// 		https://github.com/medialize/URI.js (nice API, no so nice RFC based code)
	//		next may be needed by iml (maybe)
	//		function _isAbsolute(uri) { 
	//			//TODO:
	//		}
	//		function _isOpaque(uri) { //old FRC
	//			//TODO:
	//		}

	return {
		// summary:
		//		Low-level module for uri manipulations.
		//		For higher level api, use gjax/uri/Uri.js
		decomposeComponents : decomposeComponents,
		recomposeComponents : recomposeComponents,
		recomposeAuthorityComponents : recomposeAuthorityComponents,
		resolve : resolve,
		percentEncode : percentEncode,
		encodeSegment : encodeSegment,
		encodeSegments : encodeSegments,
		decodeSegments : decodeSegments,
		encodeQuery : encodeQuery,
		encodeFragment : encodeFragment,
		removeDotSegments : removeDotSegments,
		checkEncoding : checkEncoding,
		checkSegmentEncoding : checkSegmentEncoding,
		checkSegmentsEncoding : checkSegmentsEncoding,
		checkQueryEncoding : checkQueryEncoding,
		checkFragmentEncoding : checkFragmentEncoding,
		parseQuery : parseQuery,
		isSubordinate : isSubordinate
	};
});
