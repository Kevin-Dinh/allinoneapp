define([
	"dojo/request/registry",
	"dojo/_base/lang",
	"dojo/_base/declare",
	"dojo/store/util/QueryResults",
	"gjax/uri",
	"gjax/uri/Uri",
	"dojox/lang/functional",
	"dojo/when",
	"gjax/error",
	"json/json-schema/lib/validate2",
	"dojo/Deferred",
	"dojo/string",
	"gjax/rql/template",
	"dojo/promise/all",
	"gjax/_base/date",
	"dojo/_base/array",
	"gjax/_base/kernel",
	"dojox/lang/functional/fold"
], function(requestRegistry, lang, declare, QueryResults, uri, Uri, df, when, error, validate, Deferred, string, rqlTemplate, all, gdate, array, gkernel) {

	var validateOptions = {
		// remove undefined properties if additional properties is not specified
		filter : true,
		// if property does not exists, do not validate sub properties
		existingOnly : false
	};

	var optionOperators = [
		"select",
		"collapse",
		"expand",
		"distinct",
		"sort",
		"resolved",
		"first",
		"id",
		"label",
		"notnull",
		"isnull"
	];

	var SMD_CACHE = {};

	var SchemaStore = declare(null, {
		// summary:
		//		This is a store for RESTful communicating with a server through JSON formatted data.
		//		It uses service descriptor (smd) to find out information about input schema and target URL
		// description:
		//		Features: subordinates, schema validation & object filtering,
		//		$ref attributes in schema will be expanded automatically
		//		subordinates may be lazyloaded using special ref attribute '$subRef'
		//		SMD is loaded on demand (when HTTP request is made)

		constructor : function(options) {
			// summary:
			//		This is a basic store for RESTful communicating with a server through JSON
			//		formatted data.
			// options: dojo/store/JsonRest
			//		This provides any configuration information that will be mixed into the store
			this.headers = {};
			declare.safeMixin(this, options);
			if (!this.smd) {
				throw error.newError(new Error(), "Smd must be provided", null, "gjax/store/SchemaStore", "IllegalStateException");
			}
			if (lang.isObject(this.smd)) {
				this._schemaPromise = when(this.smd);
				this._processSmd(this.smd);
			} else if (!lang.isString(this.smd)) {
				throw error.newError(new Error(), "smd parameter must be schema object or string representing URL", null, "gjax/store/SchemaStore",
						"IllegalStateException");
			} else { // String
				this.smd = Uri.resolveSvcCtx(this.smd, true); // this.smd may be already prefixed, or not
			}
		},

		// request: dojo/request
		//		dojo/request implementation used to communication with the services
		request : requestRegistry,

		// schemaRequest: dojo/request
		//		dojo/request implementation used to load the schema
		schemaRequest : requestRegistry,

		// headers: Object
		//		Additional headers to pass in all requests to the server. These can be overridden
		//		by passing additional headers to calls to the store.
		headers : null,

		// smd: String | Object
		//		Service descriptor. May be instance of schema or URI to schema
		smd : null,

		// smdBase: String
		//		Defines base URI to which are resolved subordinates' '$subRef' attribtues
		//		If value is null (default), subordinates will be resolved to this.smd if it is string (otherwise err)
		smdBase : null,

		// sortParam: String
		//		The query parameter to used for holding sort information. If this is omitted, than
		//		the sort information is included in a functional query token to avoid colliding
		//		with the set of name/value pairs.
		sortParam : null,

		requestIdentifier : null,
		noGuiBlocking : false,

		_subordinates : null,
		_target : null,
		_isCollection : null,

		_schemaPromise : null,

		_getRequestOptions : function(options) {
			// NTH this is related to appplication specific code, move out of gjax
			if (!options) {
				return {};
			}
			return {
				requestIdentifier : options.requestIdentifier || this.requestIdentifier,
				noRedirect : options.noRedirect || this.noRedirect,
				noGuiBlocking : options.noGuiBlocking || this.noGuiBlocking,
				noUserRetry : options.noUserRetry || this.noUserRetry,
				clientVector : options.clientVector || this.clientVector,
				clientCallId : options.clientCallId
			};
		},

		_ensureSchema : function(options) {
			if (!this._schemaPromise) {
				// assume that this.smd is URI and load the scheme using load function (xhr)

				// cache SMDs in scope of SchemaStore factory, to prevent multiple loading of same SMDs
				this._schemaPromise = SMD_CACHE[this.smd];
				if (!this._schemaPromise) {
					this._schemaPromise = SMD_CACHE[this.smd] = this.schemaRequest.get(this.smd, {
						noGuiBlocking : options && "noGuiBlocking" in options ? options.noGuiBlocking : this.noGuiBlocking,
						requestIdentifier : options && "requestIdentifier" in options ? options.requestIdentifier : this.requestIdentifier
					})//
					.then(gkernel.identity, lang.hitch(this, function(err) {
						// prevent caching failed requests to smd
						delete SMD_CACHE[this.smd];
						throw err;
					}));
				}

				return this._schemaPromise //
				.then(lang.hitch(this, "_processSmd"), lang.hitch(this, function(e) {
					// enable repeating failed requests to smd
					delete this._schemaPromise;
					throw e;
				}));
			}
			return this._schemaPromise;
		},

		_processSmd : function(smd) {
			this.idAttributes = smd.identity;
			this._subordinates = smd.subordinates;
			this._isCollection = !smd.singleSubordinate;
			if (!this._target) { // target will be provided by parent store, if this is subordinate store
				var t = this._target = smd.target;
				this._target = Uri.resolveSvcCtx(t, true);
			} else if (this._isCollection && !/\/$/.test(this._target)) {
				this._target += "/";
			}
			return smd;
		},

		_methodPromises : null,
		_ensureMethodSchema : function(smd, methodName, custom, methodTechName, methodTemplate) {
			// this method call ensure methodRef in methods/customMethods smd
			var methods;
			if (custom) {
				var method = smd.customMethods && smd.customMethods[methodName];
				if (method instanceof Array) { // custom methods can be defined as array or object
					methods = method;
				} else {
					methods = [
						method
					];
				}
			} else {
				methods = smd.methods && smd.methods[methodName] && smd.methods[methodName];
			}

			// search only required method definition
			// if no method definition provided resolve schemas for all methods
			if (methodTechName) {
				methods = array.filter(methods, function(m) {
					return methodTechName === m.techName;
				});
			}

			// techName is not enough, so try filter by template name
			if (methodTemplate) {
				methods = array.filter(methods, function(m) {
					return m.templates && (methodTemplate in m.templates);
				});
			}

			this._methodPromises || (this._methodPromises = {});

			// resolving by method ref value
			array.forEach(methods, function(method) {
				var methodRef = method.schema && method.schema.$methodRef;
				if (methodRef && !this._methodPromises[methodRef]) {
					var schemaUri = Uri.resolve(this.smdBase || this.smd, methodRef);
					this._methodPromises[methodRef] = this.schemaRequest.get(schemaUri, {
						noGuiBlocking : this.noGuiBlocking,
						requestIdentifier : this.requestIdentifier
					}).then(gkernel.identity, lang.hitch(this, function(err) {
						//enable repeating failed requests to smd
						delete this._methodPromises[methodRef];
						throw err;
					}));
				}
			}, this);

			// collect all resolved schemas and assign then into methods
			return all(this._methodPromises)//
			.then(function(schemas) {
				array.forEach(methods, function(method) {
					var methodRef = method.schema && method.schema.$methodRef;
					if (methodRef && (methodRef in schemas)) {
						method.schema = schemas[methodRef];
					}
				});
				return smd;
			});
		},

		_getSchemaUrl : function(response) {
			var match;

			var contentType = response.getHeader("Content-Type");
			// Content-Type: application/my-media-type+json;profile=http://json.com/my-hyper-schema
			if (contentType && (match = contentType.match(/;\s?profile=(.+)/))) {
				return match[1];
			}

			var link = response.getHeader("Link");
			// Link: <http://json.com/my-hyper-schema>; rel="describedby"
			if (link && (match = link.match(/^<(.+)>;\s?rel="describedby"/))) {
				return match[1];
			}
			return null;
		},

		_processEntity : function(dataPromise, buildIdentity, isList) {
			// summary:
			//		Create delegated object(s) with identity (and _meta if not present).
			return all({
				data : dataPromise,
				response : dataPromise.response
			}).then(lang.hitch(this, function(result) {
				var data = result.data;
				if (data) {
					var response = result.response;
					var delegateObj = {};
					if (!data._meta) {
						delegateObj._meta = {};
					}
					if (isList || data instanceof Array) {
						if (buildIdentity) {
							data = df.map(data, function(object) {
								return lang.delegate({
									_identity : this._buildIdentity(object)
								}, object);
							}, this);
						}
						lang.mixin(data, delegateObj);
					} else {
						if (buildIdentity) {
							delegateObj._identity = this._buildIdentity(data);
						}
						data = lang.delegate(delegateObj, data);
					}
					var schemaUrl = this._getSchemaUrl(result.response);
					if (schemaUrl) {
						data._meta.url = schemaUrl;
					}
					if (response.newClientCallId) {
						data._meta.newClientCallId = response.newClientCallId;
					}
				}
				return data;
			}));
		},

		_processTotal : function(dataPromise) {
			return dataPromise.response.then(function(response) {
				var range = response.getHeader("Content-Range");
				return (range && (range = range.match(/\/(.*)/)) && +range[1]) || response.data && response.data.length;
			});
		},

		// buildIdentityForCustom: Boolean
		//		Try build identity after custom operation.
		buildIdentityForCustom : false,

		callCustom : function(methodName, objOrId, objectOrQuery, options) {
			// summary:
			//		Perform cutom mehod defined by SMD.
			// description:
			//		A complete description of the function or object. Will appear in place of summary.
			// methodName: String
			//		Name of cutom method.
			// objOrId: String|Object?
			//		Identity, used if custom method has "forDetail" flag present.
			// objectOrQuery: Object?
			//		Object used as payload (for active operations) or query (for passive and delete).
			// options: Object?
			//		Standard store options. Notable options are:
			//
			//		- `query` - object to be used as query for active operations
			//		- `buildQueryResults` - is true, QueryResults object is returned instead of plain promise
			//			(useful when results of custom operations are used to populate grid).
			//		- `buildIdentity` - can be used to override store.buildIdentityForCustom attribute
			//		- `_method` - should be specified if custom method has multiple in files with different methods
			//		- `_tempalte` - should be specified to determine correct tempalte and custom method (if multiple in files)
			// returns: dojo/Deferred|dojo/store/api/Store.QueryResults

			// this implementation is highly dependent on schema structure
			options = options || {};

			var dfd = new Deferred();
			dfd.response = new Deferred();
			if (options.buildQueryResults) {
				dfd.total = new Deferred();
			}

			this._ensureSchema(options)//
			.then(lang.hitch(this, function(smd) {
				var customMethods = smd.customMethods;
				if (!customMethods || !customMethods[methodName]) {
					throw error.newError(new Error(), "Custom method '" + methodName + "' is not defined.",//
					null, "gjax/store/SchemaStore", "IllegalArgumentException");
				}
				// prepare call of custom method

				var customMethod = customMethods[methodName];
				if (lang.isArray(customMethod)) {
					customMethod = selectCustomMethod(customMethod, options);
				}

				_callCustomMethod.call(this, smd, customMethod, methodName, objOrId, objectOrQuery, options);
			})).then(gkernel.identity, dfd.reject);

			function selectCustomMethod(customMethodDefinitions, opts) {
				if (opts && opts._method) {
					// if HTTP method is defined, filter only matching customMethods
					customMethodDefinitions = array.filter(customMethodDefinitions, function(customMethodDef) {
						return customMethodDef.method == opts._method;
					});
					if (!customMethodDefinitions.length) {
						throw error.newError(new Error(), "No definition found for given HTTP method", //
						null, "gjax/store/SchemaStore", "IllegalArgumentException");
					}
				} else {
					// else check that all methods are same
					var _methodsObj = df.reduce(customMethodDefinitions, function(_methodsObj, customMethodDef) {
						_methodsObj[customMethodDef.method] = 1;
						return _methodsObj;
					}, {});
					if (df.keys(_methodsObj).length > 1) {
						throw error.newError(new Error(), "_method must be provided if multiple definitions are provided for custom method " + opts._method, //
						null, "gjax/store/SchemaStore", "IllegalArgumentException");
					}
				}
				if (customMethodDefinitions.length == 1) {
					return customMethodDefinitions[0];
				}

				// we must find correct customMethod definition according to _template and query
				var def;
				var method = customMethodDefinitions[0].method;//now we know the method
				var isEmptyQ = isEmptyQuery(/get|delete/.test(method) ? objectOrQuery : opts.query, opts, /get/.test(method));
				var isEmptyT = isEmptyTemplate(opts._template, customMethodDefinitions);

				if (isEmptyQ && isEmptyT) {
					def = _findDef(customMethodDefinitions, -1);
					if (def) {
						return def;
					} else {
						throw error.newError(new Error(), "Empty query not allowed.", //
						null, "gjax/store/SchemaStore", "IllegalArgumentException");
					}
				} else {
					def = _findDef(customMethodDefinitions, opts._template);
					if (def) {
						return def;
					} else {
						throw error.newError(new Error(), //
						"Definition " + "for template '" + opts._template + "'" + " could not be found.", //
						null, "gjax/store/SchemaStore", "IllegalArgumentException");
					}
				}

				var templ = opts && opts._template;
				if (!templ) {
					throw error.newError(new Error(), "_template must be provided if multiple definitions for one HTTP method are provided for custom method", //
					null, "gjax/store/SchemaStore", "IllegalArgumentException");
				}
				for ( var i = 0, l = customMethodDefinitions.length; i < l; i++) {
					var cmd = customMethodDefinitions[i];
					if (cmd.templates && templ in cmd.templates) {
						return cmd;
					}
				}
				throw error.newError(new Error(), "custom method definition could not be found according given _template", //
				null, "gjax/store/SchemaStore", "IllegalArgumentException");
			}

			function _callCustomMethod(smd, customMethod, methodName, objOrId, object, options) {
				var id = customMethod.forDetail ? this._getIdentity(objOrId) : objOrId;
				var isPostOrPut = customMethod.method == "post" || customMethod.method == "put";
				
				if (customMethod.forDetail && id == null) {
					throw error.newError(new Error(), "Cannot call custom method without identity", //
					null, "gjax/store/SchemaStore", "IllegalStateException");
				}
				// build target
				var target = this._resolveTarget(id, !customMethod.forDetail);
				if (!customMethod.notInUri) {
					target += (/\/$/.test(target) ? "" : "/") + methodName + (customMethod.isList ? "/" : "");
				}
				var query = isPostOrPut ? options.query : object;

				var customQueryDef = this._buildQueryDefinition(query, options, [
					customMethod
				], customMethod.method == "get");
				target = target + customQueryDef.query;

				var headers = lang.mixin({}, this.headers, options.headers, //
				customMethod.isList ? this._buildPagingHeaders(options, customQueryDef.def) : null);
				
				var requestOptions = lang.mixin({
					method : customMethod.method,
					headers : headers,
					techName : customMethod.techName,
					displayName : customMethod.displayName
				}, this._getRequestOptions(options));
				
				if (isPostOrPut) {
					requestOptions.data = object;
				}

				// resolve schema of custom method if exist and it is not resolved yet
				when(this._ensureMethodSchema(smd, methodName, true, customQueryDef.def.techName, customQueryDef.tmplName))//
				.then(lang.hitch(this, function() {
					if (isPostOrPut) {
						// validate against schema
						var vResult = validate._validate(requestOptions.data, customMethod.schema, validateOptions);
						validate.mustBeValid(vResult); // checks result and throw error if not valid
					}
					// then call custom method
					var dataPromise = this.request(target, requestOptions);
					dataPromise.response.then(dfd.response.resolve, dfd.response.reject);
					var buildIdentity = options && "buildIdentity" in options ? options.buildIdentity : this.buildIdentityForCustom;
					this._processEntity(dataPromise, buildIdentity, customMethod.isList).then(dfd.resolve, dfd.reject);
					if (options.buildQueryResults && customMethod.isList) {
						this._processTotal(dataPromise).then(dfd.total.resolve, dfd.total.reject);
					}
				}))//
				.then(gkernel.noop, dfd.reject);
			}

			if (options.buildQueryResults) {
				return QueryResults(dfd);
			}

			return dfd;
		},

		// idAttributes: String | String[]
		//		Indicates the property or properties to use as the identity.
		idAttributes : "id",

		// sendIdAttributes: boolean
		//		Indicates whether to send idAttributes in PUT payloads.
		sendIdAttributes : false,

		getIdentity : function(object, buildIdentity) {
			// summary:
			//		Returns an object's identity
			// object: Object
			//		The object to get the identity from
			// buildIdentity: Boolean
			//		If true and _identity doesnt not exist, try to build identity from object
			// returns: String|Number
			//		Identity of object
			if (object._identity != null) {
				return object._identity;
			}

			if (buildIdentity) {
				if (!this._schemaPromise || !this._schemaPromise.isResolved()) {
					throw error.newError(new Error(), "Cannot call getIdentity if scheme was not loaded before", //
					null, "gjax/store/SchemaStore", "IllegalStateException");
					// We do not expect that anyone would call this method before query/get/add/put
					// But if this would be needed, getIdentity may also return promise, but some API may not expect this (dGrid, FilteringSelect).
					// Suggested solution is sync XHR in this case
				}
				return this._buildIdentity(object);
			} else {
				return null;
			}
		},

		get : function(objOrId, options) {
			// summary:
			//		Retrieves an object by its identity. This will trigger a GET request to the server using
			//		the url `this.target + id`.
			// objOrId: Number|String|Object
			//		The identity to use to lookup the object
			// options: Object?
			//		HTTP headers. For consistency with other methods, if a `headers` key exists on this object, it will be
			//		used to provide HTTP headers instead.
			//		If a `query` key exists on this object, it will be used as query
			// returns: dojo/Deferred
			//		The object in the store that matches the given id.

			options = options || {};
			return this._ensureSchema(options).then(lang.hitch(this, function(smd) {
				if (!smd.methods.get || !smd.methods.get.length) {
					throw error.newError(new Error(), "'get' method is not supported.", //
					null, "gjax/store/SchemaStore", "UnsupportedMethodException");
				}

				var id = null;
				if (this._isCollection) {
					id = this._getIdentity(objOrId);
					if (id == null) {
						throw error.newError(new Error(), "Cannot call get without identity", //
						null, "gjax/store/SchemaStore", "IllegalStateException");
					}
				}

				var getQueryDef = this._buildQueryDefinition(options.query, options, smd.methods.get, true);

				var headers = lang.mixin({}, this.headers, options.headers);
				var dataPromise = this.request.get(this._resolveTarget(id) + getQueryDef.query, lang.mixin({
					headers : headers,
					clientVector : options.clientVector,
					techName : getQueryDef.def.techName,
					displayName : getQueryDef.def.displayName
				}, this._getRequestOptions(options)));

				return this._processEntity(dataPromise, true);
			}));
		},

		put : function(object, options) {
			// summary:
			//		Stores an object. This will trigger a POST request to the server.
			// object: Object
			//		The object to store.
			// options: Object?
			//		Additional metadata for storing the data.
			// returns: dojo/Deferred
			//		Usually returns updated entity.
			return this._ensureSchema(options).then(lang.hitch(this, function(smd) {
				if (!smd.methods.put || !smd.methods.put.length) {
					throw error.newError(new Error(), "'put' method is not supported.", //
					null, "gjax/store/SchemaStore", "UnsupportedMethodException");
				}
				var data = object;
				if (!this.sendIdAttributes) {
					data = this._removeIdentity(lang.clone(object));
				}

				options = options || {};
				var id = null;
				if (this._isCollection) {
					id = ("id" in options) ? options.id : this.getIdentity(object);
					if (id == null) {
						throw error.newError(new Error(), "Cannot call put without identity", //
						null, "gjax/store/SchemaStore", "IllegalStateException");
					}
				}
				var putQueryDef = this._buildQueryDefinition(options.query, options, smd.methods.put, false);

				return when(this._ensureMethodSchema(smd, "put", false, putQueryDef.def.techName, putQueryDef.tmplName))//
				.then(lang.hitch(this, function() {
					var dataPromise = this._post(this._resolveTarget(id) + putQueryDef.query, data, options, putQueryDef.def);
					return this._processEntity(dataPromise, true);
				}));
			}));
		},

		add : function(object, options) {
			// summary:
			//		Adds an object. This will trigger a PUT request to the server..
			// object: Object?
			//		The object to store.
			// options: Object?
			//		Additional metadata for storing the data.
			// returns: dojo/Deferred
			//		Usually returns created entity.
			return this._ensureSchema(options).then(lang.hitch(this, function(smd) {
				if (!smd.methods.add || !smd.methods.add.length) {
					throw error.newError(new Error(), "'add' method is not supported.", //
					null, "gjax/store/SchemaStore", "UnsupportedMethodException");
				}
				options = options || {};
				var addQueryDef = this._buildQueryDefinition(options.query, options, smd.methods.add, false);

				return when(this._ensureMethodSchema(smd, "add", false, addQueryDef.def.techName, addQueryDef.tmplName))//
				.then(lang.hitch(this, function() {
					var dataPromise = this._post(this._target + addQueryDef.query, object, options, addQueryDef.def);
					return this._processEntity(dataPromise, true);
				}));
			}));
		},

		_post : function(target, object, options, def) {
			var vResult = validate._validate(object, def.schema, validateOptions);
			validate.mustBeValid(vResult); // checks result and throw error if not valid

			options = options || {};
			return this.request.post(target, lang.mixin({
				data : object,
				headers : lang.mixin({}, this.headers, options.headers),
				techName : def.techName,
				displayName : def.displayName
			}, this._getRequestOptions(options)));
		},

		remove : function(id, options) {
			// summary:
			//		Deletes an object by its identity. This will trigger a DELETE request to the server.
			// identity: Number|String
			//		The identity to use to delete the object
			// options: __HeaderOptions?
			//		HTTP headers.
			//		If a `query` key exists on this object, it will be used as query
			return this._ensureSchema(options).then(lang.hitch(this, function(smd) {
				if (!smd.methods.remove || !smd.methods.remove.length) {
					throw error.newError(new Error(), "'remove' method is not supported.", //
					null, "gjax/store/SchemaStore", "UnsupportedMethodException");
				}
				if (this._isCollection && id == null) {
					throw error.newError(new Error(), "Cannot call remove without identity", //
					null, "gjax/store/SchemaStore", "IllegalStateException");
				}

				options = options || {};
				var removeQueryDef = this._buildQueryDefinition(options.query, options, smd.methods.remove, false);

				return this.request.del(this._resolveTarget(id) + removeQueryDef.query, {
					headers : lang.mixin({}, this.headers, options.headers),
					clientCallId : options.clientCallId,
					clientVector : options.clientVector,
					techName : removeQueryDef.def.techName,
					displayName : removeQueryDef.def.displayName
				});
			}));
		},

		query : function(query, options) {
			// summary:
			//		Queries the store for objects. This will trigger a GET request to the server, with the
			//		query added as a query string.
			//		SMD file may specify RQL templates for queries.
			//		If query is passed as string, it will be used for the XHR without modifications
			//		If query is passed as object and no template is specified, query will be build using objectToQuery
			//		If SMD defines only one template (in property 'template'), this temlate will be used to build the query 
			//			by feeding the template using query obj and options
			//		If SMD defines multiple templates (in property 'templates'), query object or options object must contain
			//			property '_tamplate' which defines template name.
			// query: Object|String
			//		The query to use for retrieving objects from the store.
			// options: __QueryOptions?
			//		The optional arguments to apply to the resultset.
			// returns: dojo/store/api/Store.QueryResults
			//		The results of the query, extended with iterative methods.

			options = options || {};

			var dfd = new Deferred();
			dfd.total = new Deferred();

			this._ensureSchema(options).then(lang.hitch(this, function(smd) {
				if (!smd.methods.query || !smd.methods.query.length || !this._isCollection) {
					throw error.newError(new Error(), "'query' method is not supported.",//
					null, "gjax/store/SchemaStore", "UnsupportedMethodException");
				}

				options = options || {};
				var queryQueryDef = this._buildQueryDefinition(query, options, smd.methods.query, true);
				var headers = lang.mixin({}, this.headers, options.headers, this._buildPagingHeaders(options, queryQueryDef.def));

				var dataPromise = this.request.get(this._target + queryQueryDef.query, lang.mixin({
					headers : headers,
					techName : queryQueryDef.def.techName,
					displayName : queryQueryDef.def.displayName
				}, this._getRequestOptions(options)));

				this._processEntity(dataPromise, true, true).then(dfd.resolve, dfd.reject);
				this._processTotal(dataPromise).then(dfd.total.resolve, dfd.total.reject);
			})).then(error.callbackPass, dfd.reject);

			return QueryResults(dfd);
		},

		/*jshint maxcomplexity:50 */
		_buildQueryDefinition : function(query, options, definitions, useOptionOperators) {
			// returns object containing query string and selected definition that was used

			if (query && !lang.isObject(query)) {
				throw error.newError(new Error(), "Query must be an object.", //
				null, "gjax/store/SchemaStore", "IllegalArgumentException");
			}

			var templateName = query && query._template || options._template;
			var isEmptyQ = isEmptyQuery(query, options, useOptionOperators);
			var isEmptyT = isEmptyTemplate(templateName, definitions);

			if (isEmptyQ && isEmptyT) {
				// find first definition that emptyQueryAllowed != false
				var emptyQueryDef = _findDef(definitions, -1);
				if (emptyQueryDef) {
					return {
						def : emptyQueryDef,
						query : ""
					};
				} else {
					throw error.newError(new Error(), "Empty query not allowed.", //
					null, "gjax/store/SchemaStore", "IllegalArgumentException");
				}
			} else {
				var def = _findDef(definitions, templateName);
				if (!def) {
					throw error.newError(new Error(), //
					"Query definition " + (templateName ? ("for template '" + templateName + "'") : "") + " could not be found.", //
					null, "gjax/store/SchemaStore", "IllegalArgumentException");
				}

				var tmpl;
				if (templateName) {
					tmpl = def.templates[templateName];
				} else {
					// take first
					// FIXME: this is quite dangerous, but what to do?
					var templArray;
					if ((templArray = df.values(def.templates)).length == 1) {
						tmpl = templArray[0];
					} else {
						throw error.newError(new Error(), "More than one templates found - template name must be specified", null, "gjax/store/SchemaStore",
								"IllegalArgumentException");
					}
				}
				return {
					def : def,
					tmplName : templateName,
					query : "?" + this._buildQueryFromTemplate(tmpl, query, options)
				};
			}
		},
		
		_buildQueryFromTemplate : function(template, query, options) {
			// returns query string
			return rqlTemplate.feed(template, query, options);
		},

		_buildPagingHeaders : function(options, def) {
			var pagingHeaders = {};
			if (def.paging !== false && (options.start >= 0 || options.count >= 0)) {
				// set X-Range for Opera since it blocks "Range" header
				/*jshint laxbreak:true*/
				pagingHeaders.Range = pagingHeaders["X-Range"] = "items=" + (options.start || '0') + '-'
						+ (("count" in options && options.count != Infinity) ? (options.count + (options.start || 0) - 1) : '');
			}
			return pagingHeaders;
		},

		getAvailableSubordinates : function(options) {
			// summary:
			//		Gets the list of avalible subordinates of this service as list of strings.
			// returns: dojo/Deferred

			return when(this._subordinates || this._ensureSchema(options))//
			.then(lang.hitch(this, function() {
				return df.reduce(this._subordinates, function(subordinates, val, key) {
					subordinates.push(key);
					return subordinates;
				}, []);
			}));
		},

		getSubStore : function(subordinateName, /*Object|String*/objOrId, options) {
			// summary:
			//		Gets the subordinate store for given object
			// returns: dojo/Deferred

			return this._ensureSchema(options)//
			.then(lang.hitch(this, function() {
				var id = null;
				if (this._isCollection) {
					id = this._getIdentity(objOrId);
					if (id == null) {
						throw error.newError(new Error(), "Cannot call getSubStore without identity", //
						null, "gjax/store/SchemaStore", "IllegalStateException");
					}
				}

				if (!(subordinateName in this._subordinates)) {
					throw error.newError(new Error(), "Unsupported subordinate", //
					null, "gjax/store/SchemaStore", "IllegalArgumentException");
				}

				var smd = this._subordinates[subordinateName];
				if (smd.$subRef) {
					if (!this.smdBase && !lang.isString(this.smd)) {
						throw error.newError(new Error(),//
						"If smd is not provided as String, smdBase must be provided to support resolving of subordinates' refs", //
						null, "gjax/store/SchemaStore", "IllegalStateException");
					}
					smd = Uri.resolve(this.smdBase || this.smd, smd.$subRef);
				}

				return new SchemaStore({
					smd : smd,
					request : this.request,
					schemaRequest : this.schemaRequest,
					_target : this._resolveTarget(id) + "/" + subordinateName
				});
			}));
		},

		_resolveTarget : function(id, allowNoId) {
			if (id == null && this._isCollection && !allowNoId) {
				throw error.newError(new Error(), "Cannot make request without identity", //
				null, "gjax/store/SchemaStore", "IllegalStateException");
			}
			return this._target + (this._isCollection && id != null ? uri.encodeSegment("" + id) : "");
		},

		_getIdentity : function(objOrId) {
			return typeof objOrId == "string" || typeof objOrId == "number" ? objOrId : this._buildIdentity(objOrId);
		},
		_buildIdentity : function(object) {
			var attrs = this.idAttributes;
			if (!attrs || !attrs.length) {
				// if no idAttributes specified, random id will be created
				return Math.random();
			}
			if (typeof attrs == "string") {
				return object[attrs];
			}

			for ( var i = 0; i < attrs.length; i++) {
				var template = attrs[i];
				var identity = string.substitute(template, object, transformProp, this._identityFormatters);
				if (identity.indexOf("__NO_MATCH__") == -1) {
					return identity;
				}
			}
			throw error.newError(new Error(), "No identity found", null, "gjax/store/SchemaStore", "IllegalArgumentException");

			function transformProp(v) {
				return v == null ? "__NO_MATCH__" : v;
			}
		},
		_identityFormatters : {
			"date-time" : lang.partial(gdate.toISOString, "date-time"),
			"date" : lang.partial(gdate.toISOString, "date"),
			"time" : lang.partial(gdate.toISOString, "time")
		},
		_removeIdentity : function(object) {
			var attrs = this.idAttributes;
			if (!attrs) {
				return object;
			}
			if (typeof attrs == "string") {
				delete object[attrs];
				return object;
			}

			return object; // no error when identity not found
//
//			function transformProp(v) {
//				return v == null ? "__NO_MATCH__" : v;
//			}
		}
	});

	function isEmptyTemplate(templateName/*, definitions*/) {
		// template NOT passed //or passed template does NOT EXIST in definition
		// test if template exists will be done later by _findDef
		return !templateName /*|| !array.some(definitions, function(def) {
									return def.templates && def.templates[templateName];
								})*/;
	}

	function isEmptyQuery(query, options, useOptionOperators) {
		// query is empty if it is null or empty object and query options does not contain 'option operators' (sort, select...)
		if (query && lang.isObject(query) && df.keys(query).length) {
			return false;
		}
		if (options && useOptionOperators) {
			return !df.some(optionOperators, function(operator) {
				if (operator === "sort") { //sort can be empty array in options, TODO investigate why?
					return operator in options && options[operator] instanceof Array && options[operator].length;
				}
				return operator in options;
			});
		}
		return true;
	}

	function _findDef(defs, templ) {
		// if templ==null, take first; if templ==-1 find definition with emptyQueryAllowed
		// otherwise, take definition which have template with given name
		var defToRet;
		df.some(defs, function(def) {
			var templatesExist = def.templates && df.keys(def.templates).length; //can be empty object
			if (templ == null) { // take first
				if (templatesExist) {
					defToRet = def;
					return true;
				}
			} else if (templ == -1) { // find first which has emptyQueryAllowed
				if (def.emptyQueryAllowed !== false) {
					defToRet = def;
					return true;
				}
			} else { // find first with given templateName
				if (templatesExist && def.templates[templ] != null) {
					defToRet = def;
					return true;
				}
			}
			return false;
		});
		return defToRet;
	}

	return SchemaStore;
});
