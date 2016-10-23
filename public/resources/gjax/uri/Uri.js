//	Static convenience methods //
//		1. Uri.method(that,args) //shall work with uri.decompose result //
//		2. new Uri() with the same methods and binded that //optional idea //
//	testcases are here http://localhost:8080/unius/samples/ui/test/gjax-uri/runTest.raw

/*jshint expr:true */
define([
	"gjax/_base/kernel",
	"gjax/uri",
	"dojo/_base/array",
	"dojo/_base/config",
	"gjax/io-query",
	"gjax/Collections",
	"dojo/has",
	"gjax/log/level"
], function(gkernel, uri, array, config, ioQuery, collUtils, has, level) {
	// module:
	//		gjax/uri/Uri
	// summary:
	//		Static convenience methods for URI manipulation.

	var undef;
	var decomp = uri.decomposeComponents;
	var recomp = uri.recomposeComponents;
	var decSeg = uri.decodeSegments;
	var encSeg = uri.encodeSegments;
	var clone = function(uri) {
		var p, r = {};
		for (p in uri) {
			r[p] = uri[p];
		}
		return r;
	};
	var param = function(that) {
		that != null || (that = window.document.URL); // let "" continue
		return (typeof that == "string") ? decomp(that) : clone(that);
	};
	var paramString = function(that) {
		that != null || (that = window.document.URL);
		return (typeof that == "string") ? that : recomp(that);
	};
	var contains = function(arr, what) {
		return array.indexOf(arr, what) != -1;
	};
	var isArr = function(arr) {
		return arr && (arr instanceof Array);// || typeof arr == "array");
	};
	var simpleCompare = function(a, b) {
		return (a < b ? -1 : (a > b ? 1 : 0));
	};
	var equals = function(a, b) {
		// compares plain values or arrays of plain values
		if (isArr(a) && isArr(b)) {
			return collUtils.equals(a.sort(simpleCompare), b.sort(simpleCompare));
		} else {
			return a == b;
		}
	};
	var isSubPath = function(baseStr, refStr) {
		var bs = decSeg(baseStr), rs = decSeg(refStr);
		if (bs.length > rs.length) {
			return false;
		}
		if (bs[bs.length - 1] === "") {// dont compare with void segment
			bs.pop();
		}
		for (var i = bs.length - 1; i >= 0; i--) {
			if (bs[i] != rs[i]) {
				return false;
			}
		}
		return true;
	};
	var resolve = function(base, ref) {
		// less strict version of uri.resolve, scheme is not required
		var scheme = base.scheme;
		if (!scheme) {
			base.scheme = "http";
		}
		var s = uri.resolve(base, ref);
		if (!scheme) {
			delete s.scheme;
		}
		return s;
	};
	var ctx = ""; // ensure safe value
	if (config.ctxPath) {
		ctx = config.ctxPath;
	} else {
		has("host-browser") && level("debug") && console.debug("GJAX INFO: ctxPath is null, using ''");
	}

	// 
	var convenienceAPI = {
		// summary:
		//		Static convenience methods for URI manipulation.
		// description:
		//		All functions expect `that` parameter to be either string or URI object.
		//		All functions use current window URI when `that` is null or undefined.

		fromWindow : function(wnd) {
			// summary:
			//		Use to get URI from window.
			// wnd: Window?
			//		Window reference. Defaults to current window.
			// returns: String
			//		URI of provided window.
			var that = wnd && wnd.document.URL;
			return paramString(that);
		},
		toString : function(that) {
			// summary:
			//		Use to convert uri object to string.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		URI string.
			return paramString(that);
		},
		toUri : function(that) {
			// summary:
			//		Use to convert uri to uri object.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: Object
			//		URI object with properties: `scheme`, `authority`, `userInfo`, `host`, `port`, `path`, `query`, `fragment`.
			return param(that);
		},
		navigate : function(wnd, that, ignoreHistory) {
			// summary:
			//		Use to navigate window to uri.
			// wnd: Window?
			//		Window reference. Defaults to current window.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// ignoreHistory: Boolean?
			//		If true, current page will not be saved in session History, 
			//		meaning the user won't be able to use the back button to navigate to it.
			var s = paramString(that);
			(wnd || window).location[ignoreHistory ? "replace" : "assign"](s);
		},
		equals : function(that1, that2, ignoreFragment) {
			// summary:
			//		Use to test if URIs are equal. Order of query params is ignored.
			// that1: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// that2: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// ignoreFragment: Boolean?
			//		When true, fragment (hash) is ignored when determining equality.
			// returns: Boolean
			//		True if URIs are equal, false otherwise.

			var u = param(that1), v = param(that2);
			return u.scheme == v.scheme && // return Boolean
			u.authority == v.authority && u.path == v.path && this._equalsQueryStr(u.query, v.query) && (ignoreFragment || u.fragment == v.fragment);
		},
		_equalsQueryStr : function(query1, query2) {
			if (!query1 || !query2) {
				return query1 == query2;
			}
			var i, q1 = ioQuery.queryToObject(query1), q2 = ioQuery.queryToObject(query2);
			// only simple non-hierarchical objects (possibly with arrays) will be here 
			for (i in q1) {
				if (!equals(q1[i], q2[i])) {
					return false;
				}
			}
			for (i in q2) {
				if (!equals(q2[i], q1[i])) {
					return false;
				}
			}
			return true;
		},

		// basic getters
		getScheme : function(that) {
			// summary:
			//		Use instead of location.protocol
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String|undefined
			//		String without ':' delimiter.
			var u = param(that);
			return u.scheme;
		},
		getAuthority : function(that) {
			// summary:
			//		Use instead of location.host.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			var u = param(that);
			return u.authority;
		},
		getUserInfo : function(that) {
			// summary:
			//		Use to get user info. No equivalent in location.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			var u = param(that);
			return u.userInfo;
		},
		getHost : function(that) {
			// summary:
			//		Use instead of location.hostname.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			var u = param(that);
			return u.host;
		},
		getPort : function(that) {
			// summary:
			//		Use instead of location.port.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			var u = param(that);
			return u.port;
		},
		getPath : function(that) {
			// summary:
			//		Use instead of location.search.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String|undefined
			//		String starting by '/'.
			var u = param(that);
			return u.path;
		},
		getQuery : function(that, toObject) {
			// summary:
			//		Use instead of location.search.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// toObject: Boolean?
			//		If `true` query is returned as object.
			// returns: String|Object|undefined
			//		String without '?' delimiter or key-value object.
			//		/test, false		-> undefined
			//		/test?, false		-> ""
			//		/test?a=10, false	-> "a=10"
			//
			//		/test, true			-> undefined
			//		/test?, true		-> {}
			//		/test?a=10, true	-> {a:"10"}
			var u = param(that);

			if (toObject) {
				return u.query === undefined ? undefined : //
				ioQuery.queryToObject(u.query); // "" -> {}
			} else {
				return u.query; // 1:1 with small uri.js, undefined, "" or string
			}
		},
		getFragment : function(that) {
			// summary:
			//		Use instead of location.hash.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String|undefined
			//		String without '#' delimiter.
			var u = param(that);
			// NTH: implement toObject
//			if (toObject && u.fragment != null) {
//				return ioQuery.queryToObject(u.fragment) || u.fragment;
//			}
			return u.fragment;
		},
		getSegments : function(that) {
			// summary:
			//		Use to get path segments.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String[]
			//		Array of strings, last is "" if path denotes a folder.
			var u = param(that);
			return decSeg(u.path);
		},

		// basic setters
		setScheme : function(that, scheme) {
			// summary:
			//		Use to set scheme.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// scheme: String
			//		Scheme.
			// returns: String
			//		Modified copy of `that`.
			var u = param(that);
			u.scheme = scheme;
			return recomp(u);
		},
		setAuthority : function(that, authority) {
			// summary:
			//		Use to set authority.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// authority: String
			//		Authority.
			// returns: String
			//		Modified copy of `that`.
			var u = param(that);
			u.authority = authority;
			if (authority) {
				var ac = decomp("//" + authority); // NTH: uri.decomposeAuthorityComponents function
				u.userInfo = ac.userInfo;
				u.host = ac.host;
				u.port = ac.port;
			} else {
				u.userInfo = u.host = u.port = undef;
			}
			return recomp(u);
		},
		setUserInfo : function(that, userInfo) {
			// summary:
			//		Use to set user info.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// userInfo: String
			//		User info.
			// returns: String
			//		Modified copy of `that`.
			var u = param(that);
			u.userInfo = userInfo;
			u.authority = uri.recomposeAuthorityComponents(userInfo, u.host, u.port);
			return recomp(u);
		},
		setHost : function(that, host) {
			// summary:
			//		Use to set host.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// host: String
			//		Host.
			// returns: String
			//		Modified copy of `that`.
			var u = param(that);
			u.host = host;
			u.authority = uri.recomposeAuthorityComponents(u.userInfo, host, u.port);
			return recomp(u);
		},
		setPort : function(that, port) {
			// summary:
			//		Use to set port.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// port: String
			//		Port.
			// returns: String
			//		Modified copy of `that`.
			var u = param(that);
			u.port = port;
			u.authority = uri.recomposeAuthorityComponents(u.userInfo, u.host, port);
			return recomp(u);
		},
		setPath : function(that, path) {
			// summary:
			//		Use to set path.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// path: String
			//		Encoded path.
			// returns: String
			//		Modified copy of `that`.
			var u = param(that);
			uri.checkSegmentsEncoding(path, true); // throws error is unencoded
			u.path = path;
			return recomp(u);
		},
		setQuery : function(that, query) {
			// summary:
			//		Use to set query.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// query: String|Object
			//		Encoded string or unencoded key-value object.
			// returns: String
			//		Modified copy of `that`.
			var u = param(that);
			query && typeof query != "string" && (query = ioQuery.objectToQuery(query));
			uri.checkQueryEncoding(query, true); // throws error is unencoded
			u.query = query;
			return recomp(u);
		},
		appendQuery : function(that, query) {
			// summary:
			//		Use to append query.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// query: String|Object
			//		Encoded string or key-value object.
			// returns: String
			//		Modified copy of `that`.
			if (!query) {
				return paramString(that);
			}
			var origQuery = this.getQuery(that);
			typeof query != "string" && (query = ioQuery.objectToQuery(query));
			return this.setQuery(that, (origQuery ? origQuery + "&" : "") + query);
		},
		setFragment : function(that, fragment) {
			// summary:
			//		Use to set fragment.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// fragment: String|Object
			//		Encoded string or key-value object.
			// returns: String
			//		Modified copy of `that`.
			var u = param(that);
			fragment && typeof fragment != "string" && (fragment = ioQuery.objectToQuery(fragment));
			uri.checkFragmentEncoding(fragment, true); // throws error is unencoded
			u.fragment = fragment;
			return recomp(u);
		},
		appendFragment : function(that, fragment) {
			// summary:
			//		Use to append fragment.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// fragment: String|Object
			//		Encoded string or key-value object.
			// returns: String
			//		Modified copy of `that`.
			if (!fragment) {
				return paramString(that);
			}
			var origFragment = this.getFragment(that);
			typeof fragment != "string" && (fragment = ioQuery.objectToQuery(fragment));
			return this.setFragment(that, (origFragment ? origFragment + "&" : "") + fragment); // return String
		},
		setSegments : function(that, segments) {
			// summary:
			//		Use to set path segments.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// segments: String[]
			//		Array of unencoded path segments.
			// returns: String
			//		Modified copy of `that`.
			return this.setPath(that, encSeg(segments));
		},
		appendSegments : function(that/*=====, segments =====*/) {
			// summary:
			//		Use to append path segments.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// segments: String[]|String...
			//		Array or multiple arguments of unencoded path segments.
			// returns: String
			//		Modified copy of `that`.

			var segments = this.getSegments(that);
			var appendSegmets = Array.prototype.slice.call(arguments, 1);
			(appendSegmets[0] instanceof Array) && (appendSegmets = appendSegmets[0]);
			gkernel.asrt(appendSegmets[0] != null, "IllegalArgument, segments argument not present");
			!segments[segments.length - 1] && segments.pop(); //isLastSegmentEmpty
			return this.setSegments(that, segments.concat(appendSegmets));
		},
		mixin : function(that, obj) {
			// summary:
			//		Use to set multiple URI parts at once.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// obj: Object
			//		Available properties: `scheme`, `authority`, `userInfo`, `host`, `port`, `path`, `query`, `fragment`.
			//		If `authority` property is present, `userInfo`, `host` and `port` are ignored.
			//		All properties are strings except `query` and `fragment` which may also be objects.
			// returns: String
			//		Modified copy of `that`.
			var u = param(that);
			if ("authority" in obj) {
				u.authority = obj.authority;
				if (u.authority) {
					var ac = decomp("//" + u.authority); // NTH uri.decomposeAuthorityComponents
					u.userInfo = ac.userInfo;
					u.host = ac.host;
					u.port = ac.port;
				} else {
					u.userInfo = u.host = u.port = undef;
				}
			} else {
				"userInfo" in obj && (u.userInfo = obj.userInfo);
				"host" in obj && (u.host = obj.host);
				"port" in obj && (u.port = obj.port);
				u.authority = uri.recomposeAuthorityComponents(u.userInfo, u.host, u.port);
			}
			"scheme" in obj && (u.scheme = obj.scheme);
			"path" in obj && (u.path = obj.path);
			var q = obj.query, f = obj.fragment;
			"query" in obj && (u.query = q && typeof q != "string" ? ioQuery.objectToQuery(q) : q);
			"fragment" in obj && (u.fragment = f && typeof f != "string" ? ioQuery.objectToQuery(f) : f);
			return recomp(u);
		},

		// stripping specific parts of URI

		stripOrigin : function(that) {
			// summary:
			//		Use to get path with query and fragment.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that`.
			return this.strip(that, "ORIGIN");
		},
		stripExtension : function(that) {
			// summary:
			//		Use to get uri without path extension.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that`.
			// example:
			//	|	Uri.stripExtension("/samples/ui/test/aam-test.standalone");	//	"/samples/ui/test/aam-test"
			//	|	Uri.stripExtension("/samples/ui/test/aam-test.a.b.c");		//	"/samples/ui/test/aam-test"
			//	|	Uri.stripExtension("/samples/ui/test/aam-test");			//	"/samples/ui/test/aam-test"
			return this.strip(that, "EXTENSION");
		},
		stripCtxPath : function(that) {
			// summary:
			//		Use to get path after context with query and fragment.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that`.
			return this.strip(that, "ORIGIN,CTX");
		},
		stripCtxPrefix : function(that) {
			// summary:
			//		Use to get path after context prefix (UI or svc) with query and fragment.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that`.
			return this.strip(that, "ORIGIN,CTX_PREFIX");
		},
		stripPath : function(that) {
			// summary:
			//		Use to get origin, i.e. everything before path.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that`.
			return this.strip(that, "PATH,QUERY,FRAGMENT");
		},
		stripQuery : function(that) {
			// summary:
			//		Use to get URI without query.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that`.
			return this.strip(that, "QUERY");
		},
		stripFragment : function(that) {
			// summary:
			//		Use to get URI without fragment.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that`.
			return this.strip(that, "FRAGMENT");
		},
		getScreenPath : function(that) {
			// summary:
			//		Use to get path after context and before extension.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that`.
			return this.strip(that, "ORIGIN,CTX,EXTENSION,QUERY,FRAGMENT");
		},
		strip : function(that, toStrip) {
			// summary:
			//		Use to strip some parts of URI.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// toStrip: String
			//		Comma separated values, available are: "ORIGIN", "CTX", "EXTENSION", "QUERY", "FRAGMENT".
			// returns: String
			//		Modified copy of `that`.
			// example:
			//	|	Uri.strip(uriStr, "QUERY,FRAGMENT");
			var u = param(that);
			toStrip = toStrip.split(",");

			if (contains(toStrip, "ORIGIN")) {
				// clear them all to keep object consistent for auth invariant
				u.scheme = u.authority = u.host = u.port = u.userInfo = undefined; // orig uses undefined not nulls
			}
			if (contains(toStrip, "PATH")) {
				u.path = ""; // dont use undefined, resulting path should be empty ("/")
			} else {
				if (contains(toStrip, "CTX")) {
					gkernel.asrt(isSubPath(ctx, u.path), "IllegalArgument, context not present");
					u.path = u.path.substring(ctx.length);
				} else if (contains(toStrip, "CTX_PREFIX")) {
					var uiPrefix = config.uiCtxPrefix, svcPrefix = config.svcCtxPrefix;
					if (isSubPath(uiPrefix, u.path)) {
						u.path = u.path.substring(uiPrefix.length);
					} else if (isSubPath(svcPrefix, u.path)) {
						u.path = u.path.substring(svcPrefix.length);
					} else {
						gkernel.asrt(false, "IllegalArgument, context prefix not present");
					}
				}
				if (contains(toStrip, "EXTENSION")) {
					var segments = decSeg(u.path), l = segments.length;
					if (l) {
						var last = segments[l - 1];
						var dotIndex = last.indexOf(".");
						if (dotIndex != -1) {
							segments[l - 1] = last.substring(0, dotIndex);
							u.path = encSeg(segments);
						}
					}
				}
			}
			if (contains(toStrip, "QUERY")) {
				u.query = undefined;
			}
			if (contains(toStrip, "FRAGMENT")) {
				u.fragment = undefined;
			}
			return recomp(u);
		},
		// NTH encoders

		// path functions

		getLastSegment : function(that) {
			// summary:
			//		Use to get the last path segment.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Empty string when `that` denotes folder, `undefined` if path is empty.
			var u = param(that);
			return decSeg(u.path).pop();
		},
		// NTH: getLastNonVoidSegment ???
		denotesFolder : function(that) {
			// summary:
			//		Use to test if path ends with '/'.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: Boolean
			//		

			// will be string so this should be enough
			return this.getLastSegment(that) === "";
		},
		convertToFolder : function(that) {
			// summary:
			//		Use to convert URI path to folder.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that` ending with '/'.
			// example:
			//	|	Uri.convertToFolder("/samples/ui/test/aam-test");	// 	"/samples/ui/test/"
			//	|	Uri.convertToFolder("/samples/ui/test/");	 		//	"/samples/ui/test/"
			var u = param(that);
			var segments = decSeg(u.path);
			segments.length ? segments[segments.length - 1] = "" : segments.push("");
			u.path = encSeg(segments);
			return recomp(u);
		},
		isSubordinate : function(that, ref) {
			// summary:
			//		Use to test if ref URI is subordiante of base URI.
			// that: String|Object|null
			//		Base URI. URI string or URI object. Current window URI used when null or undefined.
			// ref: String|Object|null
			//		Ref URI. URI string or URI object. Current window URI used when null or undefined.
			// returns: Boolean
			//		True if `ref` is subordinate of `base`.
			var u = param(that), r = param(ref);
			return uri.isSubordinate(u, r, true);
		},
		resolve : function(that, ref) {
			// summary:
			//		Use to resolve ref URI using base URI.
			// that: String|Object|null
			//		Base URI. URI string or URI object. Current window URI used when null or undefined.
			// ref: String|Object|null
			//		Ref URI. URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that`.
			var u = param(that), r = param(ref), //
			s = resolve(u, r);
			return recomp(s);
		},
		resolveAsSubordinate : function(that, ref) {
			// summary:
			//		Use to resolve ref URI as subordinate of base URI.
			// that: String|Object|null
			//		Base URI. URI string or URI object. Current window URI used when null or undefined.
			// ref: String|Object|null
			//		Ref URI. URI string or URI object. Current window URI used when null or undefined.
			// returns: String
			//		Modified copy of `that`.
			var u = param(this.convertToFolder(that)), r = param(ref), //
			s = resolve(u, r);
			gkernel.asrt(this.isSubordinate(u, s), "IllegalArgument, not subordinate");
			return recomp(s);
		},
		parseId : function(that) {
			// summary:
			//		Use to retrieve resource id from RESTful URI.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// returns: Integer
			//		Id.
			var id = parseInt(this.getLastSegment(that), 10);
			gkernel.asrt(!isNaN(id), "IllegalArgument, numeric id not present");
			return id;
		},
		_prependCtxPrefix : function(that, prefix, checkResolved) {
			// tags:
			//		private
			var u = param(that);
			gkernel.asrt(!u.authority && !u.scheme, "IllegalArgument, origin not expected");
			var segments = decSeg(u.path);
			var ctxSegments = decSeg(prefix);
			var hasPrefix = checkResolved && array.every(ctxSegments, function(seg, i) {
				return segments[i] == seg;
			});
			if (!hasPrefix) {
				u.path = encSeg(ctxSegments.concat(segments));
			}
			return recomp(u);
		},
		resolveSvcCtx : function(that, checkResolved) {
			// summary:
			//		Use to add service context prefix to path.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// checkResolved: booelan?
			//		Use true when `that` may already contain context prefix. In that case, no extra prefix will be added.
			// returns: String
			//		Modified copy of `that`.
			if (typeof that == "string" && that.indexOf("^") === 0) {
				that = that.substring(1);
			}
			var svcCtxPrefix = config.svcCtxPrefix;
			gkernel.asrt(svcCtxPrefix != null, "IllegalState, 'config.svcCtxPrefix' is not defined or empty");

			return has("host-browser") || !config.__svcServer //
			? this._prependCtxPrefix(that, svcCtxPrefix, checkResolved) //browser or server size without special config, relative urls
			: this.resolve(config.__svcServer, this._prependCtxPrefix(that, svcCtxPrefix, checkResolved)); //server + special config (tests), absolute urls
		},
		resolveUiCtx : function(that, checkResolved) {
			// summary:
			//		Use to add UI context prefix to path.
			// that: String|Object|null
			//		URI string or URI object. Current window URI used when null or undefined.
			// checkResolved: booelan?
			//		Use true when `that` may already contain context prefix. In that case, no extra prefix will be added.
			// returns: String
			//		Modified copy of `that`.
			if (typeof that == "string" && that.indexOf("^") === 0) {
				that = that.substring(1);
			}
			var uiCtxPrefix = config.uiCtxPrefix;
			gkernel.asrt(uiCtxPrefix != null, "IllegalState, 'config.uiCtxPrefix' is not defined or empty");
			return has("host-browser") || !config.__uiServer //
			? this._prependCtxPrefix(that, uiCtxPrefix, checkResolved) //browser or server size without special config, relative urls
			: this.resolve(config.__uiServer, this._prependCtxPrefix(that, uiCtxPrefix, checkResolved)); //server + special config (tests), absolute urls
		}
	};

	var Uri = convenienceAPI;
	return Uri;
});