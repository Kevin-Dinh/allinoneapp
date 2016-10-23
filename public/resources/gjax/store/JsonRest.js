define([
	"dojo/request/registry",
	"gjax/request/jsonXhr",
	"dojo/_base/lang",
	"dojo/_base/declare",
	"dojo/store/util/QueryResults",
	"gjax/io-query",
	"gjax/uri"
], function(request, jsonXhr, lang, declare, QueryResults, ioQuery, uri) {

	/*=====
	var __HeaderOptions = {
			// headers: Object?
			//		Additional headers to send along with the request.
		},
		__PutDirectives = declare(Store.PutDirectives, __HeaderOptions),
		__QueryOptions = declare(Store.QueryOptions, __HeaderOptions);
	=====*/

	var encSeg = function(s) {
		return uri.encodeSegment("" + s);
	};

	return declare(null, {
		// summary:
		//		This is a basic store for RESTful communicating with a server through JSON
		//		formatted data. It implements dojo/store/api/Store.

		// request: [const] dojo/request
		//		Request that will be used. Defaults to dojo/request/registry. But this.target will be registered for gjax/request/registry.
		//		If custom implementation is passed, it must take care of JSON formatting/parsing
		request : request,

		requestIdentifier : null,
		noRedirect : null,
		noGuiBlocking : null,
		noUserRetry : null,

		constructor : function(options) {
			// summary:
			//		This is a basic store for RESTful communicating with a server through JSON
			//		formatted data.
			// options: dojo/store/JsonRest
			//		This provides any configuration information that will be mixed into the store
			this.headers = {};
			declare.safeMixin(this, options);

			//we want to use registry, but we also want to relay on request impl to do JSON parsing
			//so register this target for jsonXhr, but not as 'first' so anyone can register other request
			request.register(new RegExp("^" + this.target), jsonXhr, false);
		},

		// headers: Object
		//		Additional headers to pass in all requests to the server. These can be overridden
		//		by passing additional headers to calls to the store.
		headers : {},

		// target: String
		//		The target base URL to use for all requests to the server. This string will be
		//		prepended to the id to generate the URL (relative or absolute) for requests
		//		sent to the server
		target : "",

		// idProperty: String
		//		Indicates the property to use as the identity property. The values of this
		//		property should be unique.
		idProperty : "id",

		// sendIdProperty: boolean
		//		Indicates if send idProperty in PUT payload  
		sendIdProperty : false,

		// sortParam: String
		//		The query parameter to used for holding sort information. If this is omitted, than
		//		the sort information is included in a functional query token specified by sortOperator to avoid colliding
		//		with the set of name/value pairs.
		sortParam : null,

		// sortOperator: String
		//		The functional query sort parameter name.
		sortOperator : "sort",

		_getRequestOptions : function(options) {
			//NTH this is related to appplication specific code, move out of gjax
			if (!options) {
				return {};
			}
			return {
				requestIdentifier : options.requestIdentifier || this.requestIdentifier,
				noRedirect : options.noRedirect || this.noRedirect,
				noGuiBlocking : options.noGuiBlocking || this.noGuiBlocking,
				noUserRetry : options.noUserRetry || this.noUserRetry,
				clientVector : options.clientVector || this.clientVector,
				clientCallId : options.clientCallId,
				//for jsonRefXhr
				idAttribute : options.idAttribute || this.idProperty
			};
		},

		get : function(id, options) {
			// summary:
			//		Retrieves an object by its identity. This will trigger a GET request to the server using
			//		the url `this.target + id`.
			// id: Number
			//		The identity to use to lookup the object
			// options: Object?
			//		Options for request.
			// returns: Object
			//		The object in the store that matches the given id.
			options = options || {};
			var headers = lang.mixin({}, this.headers, options.headers);

			var query;
			if (options && options.query) {
				query = options.query;
				var hasQuestionMark = this.target.indexOf("?") > -1;
				if (query && typeof query == "object") {
					query = ioQuery.objectToQuery(query);
					query = query ? (hasQuestionMark ? "&" : "?") + query : "";
				}
				if (!hasQuestionMark && query && query.indexOf("?") !== 0) {
					query = "?" + query;
				}
			}

			return this.request.get(this.target + encSeg(id) + (query || ""), lang.mixin({
				headers : headers,
				handleAs : "json"
			}, this._getRequestOptions(options)));
		},

		accepts : "application/javascript, application/json",

		getIdentity : function(object) {
			// summary:
			//		Returns an object's identity
			// object: Object
			//		The object to get the identity from
			// returns: Number
			return object[this.idProperty];
		},

		put : function(object, options) {
			// summary:
			//		Stores an object. This will trigger a PUT request to the server
			//		if the object has an id, otherwise it will trigger a POST request.
			// object: Object
			//		The object to store.
			// options: __PutDirectives?
			//		Additional metadata for storing the data.  Includes an "id"
			//		property if a specific id is to be used.
			// returns: dojo/Deferred
			options = options || {};
			var id = ("id" in options) ? options.id : this.getIdentity(object);
			var hasId = typeof id != "undefined";
			var data = object;
			if (!this.sendIdProperty) {
				data = lang.clone(object);
				delete data[this.idProperty];
			}
			return this.request(hasId ? this.target + encSeg(id) : this.target, lang.mixin({
				method : hasId && !options.incremental ? "PUT" : "POST",
				data : data,
				handleAs : "json",
				headers : lang.mixin({
					"Content-Type" : "application/json", /* git-qa */
					Accept : this.accepts,
					"If-Match" : options.overwrite === true ? "*" : null,
					"If-None-Match" : options.overwrite === false ? "*" : null
				}, this.headers, options.headers)
			}, this._getRequestOptions(options)));
		},

		add : function(object, options) {
			// summary:
			//		Adds an object. This will trigger a PUT request to the server
			//		if the object has an id, otherwise it will trigger a POST request.
			// object: Object
			//		The object to store.
			// options: __PutDirectives?
			//		Additional metadata for storing the data.  Includes an "id"
			//		property if a specific id is to be used.
			options = options || {};
			options.overwrite = false;
			return this.put(object, options);
		},

		remove : function(id, options) {
			// summary:
			//		Deletes an object by its identity. This will trigger a DELETE request to the server.
			// id: Number
			//		The identity to use to delete the object
			// options: __HeaderOptions?
			//		HTTP headers.
			options = options || {};
			return this.request.del(this.target + encSeg(id), lang.mixin({
				headers : lang.mixin({}, this.headers, options.headers)
			}, this._getRequestOptions(options)));
		},

		query : function(query, options) {
			// summary:
			//		Queries the store for objects. This will trigger a GET request to the server, with the
			//		query added as a query string.
			// query: Object
			//		The query to use for retrieving objects from the store.
			// options: __QueryOptions?
			//		The optional arguments to apply to the resultset.
			// returns: dojo/store/api/Store.QueryResults
			//		The results of the query, extended with iterative methods.

			/*jshint maxcomplexity:30 */

			options = options || {};

			var headers = lang.mixin({
				Accept : this.accepts
			}, this.headers, options.headers);

			if (options.start >= 0 || options.count >= 0) {
				//set X-Range for Opera since it blocks "Range" header
				/*jshint laxbreak:true*/
				headers.Range = headers["X-Range"] = "items=" + (options.start || '0') + '-'
						+ (("count" in options && options.count != Infinity) ? (options.count + (options.start || 0) - 1) : '');
			}
			var hasQuestionMark = this.target.indexOf("?") > -1;

			if (query == null) {
				//in next steps we use "query+=..", which would cause "null?sort..." if we skip this normalization
				query = "";
			} else if (typeof query == "object") {
				query = ioQuery.objectToQuery(query);
				query = options.noQuestionMark ? query : (query ? (hasQuestionMark ? "&" : "?") + query : "");
			}

			if (options && options.sort && options.sort.length) {
				var sortParam = this.sortParam;
				query += (query || hasQuestionMark ? "&" : "?") + (sortParam ? sortParam + '=' : this.sortOperator + "(");
				for (var i = 0; i < options.sort.length; i++) {
					var sort = options.sort[i];
					query += (i > 0 ? "," : "") + (sort.descending ? '-' : '+') + encodeURIComponent(sort.attribute);
				}
				if (!sortParam) {
					query += ")";
				}
			}

			if (!options.noQuestionMark && !hasQuestionMark && query && query.indexOf("?") !== 0) {
				query = "?" + query;
			}
			var results = this.request.get(this.target + (query || ""), lang.mixin({
				handleAs : "json",
				headers : headers
			}, this._getRequestOptions(options)), true /*returnDeferred*/);

			results = lang.delegate(results, {
				//TODO check leaks
				total : results.response.then(function(response) {
					var range = response.getHeader("Content-Range");
					return range && (range = range.match(/\/(.*)/)) && +range[1];
				})
			});

			return QueryResults(results);
		}
	});

});