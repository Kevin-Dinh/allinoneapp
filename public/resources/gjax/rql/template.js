/**
 * @author	 		mbeliansky
 */
define([
	"rql/parser",
	"rql/query", // see line 279 in rql/parser.js, added toString() and toFIQL() methods
	"dojo/_base/array",
	"dojo/_base/lang",
	"gjax/_base/date",
	"dojo/date/stamp",
	"./toFIQL",
	"dojo/string",
	"gjax/_base/object",
	"dojox/lang/functional",
	"gjax/lang/blacklistMixin"
], function(rqlParser, rqlQuery, array, lang, gdate, dstamp, toFIQL, string, gobject, df, blacklistMixin) {

	// see more samples here: /app-ui/src/main/webapp/WEB-INF/views/unit-test/gjax/rql/template

	var exports = {
		// summary:
		//		Transforms given query object and options to string query by defined RQL template.
		// example:
		//		|	rqlTemplate.feed("policyNumber=*[&sort(*)]", { policyNumber: "123" }) // "policyNumber=123"
		//		|	rqlTemplate.feed("policyNumber=*[&sort(*)]", { policyNumber: "123" }, { sort: [ { attribute: "policyNumber", descending: true } ]}) // "policyNumber=123&sort(-policyNumber)"
		parser : rqlParser.parseGently,
		//if more than one query must be feeded, will be joined with OR operator and
		//global operators are placed out of optional group at the end of query
		globalOperators : [
			"select",
			"collapse",
			"expand",
			"distinct",
			"sort",
			"resolved",
			"first",
			"id",
			"label"
		],
		naryOperators : [ //by options only
			"select",
			"collapse",
			"expand",
			"sort", //nullFirst,nullLast
			"id",
			"label",
			"notnull",
			"isnull"
		],
		binaryOperators : [ //by query only
			//first argument is always name of property
			"eq",
			"ne",
			"like",
			"notLike",
			"ciLike",
			"cdiLike",
			"lt",
			"le",
			"gt",
			"ge",
			"out",
			"in"
		],
		unaryOperators : [
			"resolved" //by options - true,false
		],
		nullaryOperators : [ //by options only
			"distinct",
			"first"
		]
	};

	function parse(/*String*/query, /*object*/operation) {
		if (query.charAt(0) == "&") {
			throw new URIError("Query must not start with &");
		}

		return exports.parser(preprocessing(query, operation), {});

		function preprocessing(/*String*/query, /*object*/operation) {
			// converts unparsable to operators
			// 1. convert optional groups to custom operators (andOpt or orOpt)
			query = query.replace(/(\[)([&|][^\]]*)(\]\+?)/g, function(str, begin, optionalGroups, end) {
				var type = optionalGroups.substring(0, 1), //
				opt = type === "&" ? "andOpt" : "orOpt";
				if (end[1] === "+") {
					opt += "Plus";
				}
				var groups = optionalGroups.substring(1).split(/\?[\|\&]{1}/);
				return type + opt + "(" + groups.join(",") + ")";
			});
			// 2. convert operations group into custom operator (operation)
			query = query.replace(/(\{[\&\|]?)([^\}]*)(\}?)\(([^\)]*)\)/g, function(str, begin, ops, end, attrs) {
				ops = ops.split(",");
				if (ops.length > 1) { // 
					return "operation(" + attrs + ",(" + ops.join(",") + "))";
				}
				return ops[0] + "(" + attrs + ")";
			});
			// 3. convert operations defined as array, rql template will be expanted
			var attrs = df.mapIn(df.filterIn(operation, function(v) {
				return v instanceof Array;
			}), "v,k->k");

			df.forIn(attrs, function(v, attr) {
				query = query.replace(new RegExp("operation\\(" + attr + ",\\*,\\(([^\\)]*)\\)\\)", "g"), function(str, ops) {
					ops = ops.split(","); // allowed operations

					// check if all given operations are allowed
					operation[attr].forEach(function(o) {
						if (!~ops.indexOf(o)) {
							throw new URIError(string.substitute("Operation '${0}' for '${1}' property is not allowed", [
								o,
								attr
							]));
						}
					});

					return operation[attr].map(function(o) {
						return o + "(" + attr + ",*)";
					}).join(",");

				});
			});

			//prevent 'Can not mix conjunctions within a group' error
			var andCount = query.split(/\&/g).length - 1, orCount = query.split(/\|/g).length - 1;
			if (andCount === 0 && orCount) {
				query = "(" + query + ")";
			}
			return query;
		}

	}

	exports.parse = parse;

	function _isObject(o) {
		return o instanceof rqlQuery.Query;
	}

	function _isResolved(a) {
		return a._resolved || a.name === "or"; // or is not to be resolved (only all child should be resolved)
	}

	function _deleteUnresolved(args) {
		return array.filter(args, _isResolved);
	}

	function in_array(a, v) {
		return array.indexOf(a, v) !== -1;
	}

	function resolveArgs(object, options, isInGroup, propertyMapping, /*query.Query*/query) {
		if (_isObject(query)) {
			var args = query.args, name = query.name;
			if (array.some(args, _isObject)) {
				var isGroup = !!/(?:and|or)Opt(?:Plus)?/.exec(name);
				array.forEach(args, lang.partial(resolveArgs, object, options, isGroup, propertyMapping));
				// --------------------------------------------------------
				// handle optional groups
				if (isGroup) {
					if (!array.every(args, _isResolved)) {
						// delete unresolved props
						query.args = args = _deleteUnresolved(args);
					}
					if (name.indexOf("Plus") > -1 && (!args.length || !array.some(args, _isResolved))) {
						// if at least one is required from group raise exception
						throw new URIError("At least one parameter is required in this optional group");
					}
				}
				// --------------------------------------------------------
			} else {
				_resolveArg(object, options, query, isInGroup, propertyMapping);
			}
		}
	}

	function _resolveArg(object, options, /*query.Query*/query, isInGroup, propertyMapping) { /*jshint maxcomplexity:50 */
		var opName = query.name, //
		args = query.args, property;

		// TODO: use _isArgResolved for custom required operators
		//		 use _isArgResolved for filled eq/in/out/... operators

		// nullary operators
		if (in_array(exports.nullaryOperators, opName) //
				&& (!isInGroup || (opName in options && options[opName]))) {
			query._resolved = true;
			return;
		}

		// check if all arguments are resolved
		if (!isInGroup && _allArgsResolved(opName, args)) {
			query._resolved = true;
			return;
		}

		// unary operatos
		if (in_array(exports.unaryOperators, opName) && args.length) {
			if (_isArgResolved(args[0])) {
				query._resolved = true;
				return;
			}
			args[0] = _convertValue(object && object[opName] || options[opName], args[0], opName, isInGroup);
			if (args[0] != null) {
				query._resolved = true;
			}
			return;
		}

		// special unary operator: operation
		if ("operation" === opName && args.length) {
			property = args[0];
			if (object && property in object) {
				if (object[property] === null) {
					query._resolved = true;
				}
			}
		}

		//binary operators: eq(),like(),...
		if (in_array(exports.binaryOperators, opName) || "operation" === opName) {
			property = args[0];
			if (object && property in object) {
				var value = object[property]; // if property defined on object
				if (typeof value == "undefined" && !isInGroup) {
					raiseMissingValueError(property);
				}
				if ("operation" !== opName && (value instanceof Array) && ((property in propertyMapping) || _usePointerFeeder(opName, value))) {
					//create pointer and fill only actual value from array
					value = _feedFromArray(property, value, propertyMapping);
				}
				args[1] = _convertValue(value, args[1], property, isInGroup);
				if (args[1] != null) {
					query._resolved = true;
				}
				return;
			}
		}

		//nary operators: sort(),select(),...
		if (in_array(exports.naryOperators, opName)) {
			property = options[opName]; // should be array by default, string or boolean
			if (property instanceof Array) {
				if (property.length) {
					query.args = array.map(property, lang.partial(_buildProp, opName));
					query._resolved = true;
					return;
				} else if (!isInGroup) {
					raiseMissingValueError(opName);
				}
			} else {
				// if string defined, we do not need build from object
				if (typeof property === "string") {
					query.args = property.split(",");
					query._resolved = true;
					return;
				}
				if (typeof property === "boolean") {
					query.args[0] = property;
					query._resolved = true;
					return;
				}
			}
		}

		if (!isInGroup) {
			raiseMissingValueError(property || opName);
		}

		function _usePointerFeeder(opName, value) {
			return !RegExp(/in|out/).exec(opName) || array.some(value, function(a) {
				// a : [[1,2], 3]
				// {gt,out}(a,*) -> out(a,(1,2))&gt(z2,3)
				return a instanceof Array;
			});
		}
		function _allArgsResolved(opName, args) {
			//first and second arguments should be resolved
			if (opName === "sort") {
				return args.length && args[0] !== "*";
			}
			return array.every(args, function(arg) {
				//arguments can be resolved as string, boolean or number value (can be null?)
				return (typeof arg === "string" && _isArgResolved(arg)) || typeof arg === "boolean" || typeof arg === "number";
			});
		}

		function _isArgResolved(arg) {
			return arg.indexOf("*") !== 0 && arg.indexOf("+") !== 0;
		}

		function _convertValue(value, property, propertyName, isInGroup) {
			var dateValue = value; //do not modify original date, try to convert string value
			typeof value === "string" && isISOString(value) && (dateValue = dstamp.fromISOString(value));
			if (dateValue && gdate.isDate(dateValue)) {
				var converter = property.length && property.substring(1);
				//convert date to string, date-time is default format
				return gdate.toISOString(converter || "date-time", dateValue);
			}

			if (property === "+" && value === "") { //do not allow query with empty property				
				if (isInGroup) { //empty value is not resolved in optional group
					return null;
				}
				raiseEmptyValueError(propertyName);
			}
			return value;

			//FIXME better check for string date-time format (stamp._isoRegExp is not enought)
			//taken from io-query.js
			function isISOString(str) {
				// ISO str with required full date part - to prevent yearlike numbers (e.g. 1234) to be converted to date
				return typeof str == "string" && ~str.search(/^\d{4}-\d{2}-\d{2}(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+\-](\d{2}):(\d{2}))|Z)?)?$/);
			}
		}

		function _feedFromArray(property, arr, mapping) {
			if (!(property in mapping)) {
				mapping[property] = 0;
			}
			return arr[mapping[property]++];
		}

		function _buildProp(name, property) {
			if (name !== "sort") {
				return property;
			} else {
				return nullOrder(property, (property.descending ? "-" : "+") + property.attribute);
			}

			function nullOrder(p, a) {
				if (p.nullFirst || p.nullLast) {
					// must create new Query if nulls order setting present
					return rqlQuery.Query({
						name : p.nullFirst ? "nullFirst" : "nullLast",
						args : [
							a
						]
					});
				}
				return a;
			}
		}

		function raiseMissingValueError(name) {
			throw new URIError(string.substitute("Missing value for property '${0}'", [
				name
			]));
		}

		function raiseEmptyValueError(name) {
			throw new URIError(string.substitute("Non empty value expected for property '${0}'", [
				name
			]));
		}
	}

	function feed(/*String*/rqlTmpl, /*Object|Array*/query, options) {
		// feed query with object and options

		var parsedQuery = parse(rqlTmpl, options._operation);
		if (parsedQuery.error) {
			throw new URIError("Query parser: " + parsedQuery.error);
		}

		//only simple query present
		if (!(query instanceof Array)) {
			return toFIQL(_resolve(query, options, parsedQuery));
		}

		//if only one or zero query criteria passed, do not wrap into OR condition
		if (query instanceof Array && (query.length === 0 || query.length === 1)) {
			var queryOperations = options._operation;
			(queryOperations instanceof Array) && (queryOperations = queryOperations[0] || {});
			return toFIQL(_resolve(query[0] || {}, blacklistMixin([
				"_operation"
			], {
				_operation : queryOperations
			}, options), parsedQuery));
		}

		//more queries to be done
		//iterate throught query and feed, but feed only 'non-global' operators
		var queryList = _filterQuery(query), //
		parsedQueries = array.map(queryList, function(q, queryIndex) {
			//clone query, create object to feed
			var queryOperations = options._operation;
			(queryOperations instanceof Array) && (queryOperations = queryOperations[queryIndex]);
			return _resolve(q, blacklistMixin([
				"_operation"
			], {
				_operation : queryOperations
			}, options), parse(rqlTmpl, queryOperations));
		}), //
		orQuery = rqlQuery.Query({
			name : "or", //join into OR condition
			args : parsedQueries
		});

		var usedMap = [], globalOpts = [];
		_extractGlobal(globalOpts, usedMap, options._global || [], orQuery);

		var globalQuery = rqlQuery.Query({
			name : "and",
			args : []
		});

		// keep only non empty queries
		orQuery.args = array.filter(orQuery.args, function(query) {
			return query.args.length;
		});

		// if there are still or condition
		if (orQuery.args.length) {
			globalQuery.push(orQuery);
		}

		if (globalOpts.length) {
			Array.prototype.push.apply(globalQuery.args, globalOpts);
		}

		return toFIQL(rqlQuery.Query({
			name : "and",
			args : [
				globalQuery
			]
		}));

		function _extractGlobal(globalOpts, usedMap, globalFields, query) {
			var args = query.args, name = query.name;
			if (typeof query == "object") {
				if (array.some(args, _isObject)) {
					array.forEach(args, lang.partial(_extractGlobal, globalOpts, usedMap, globalFields));
					query.args = array.filter(query.args, function(query) {
						var isNotGlobal = array.indexOf(exports.globalOperators, query.name) === -1;
						if (isNotGlobal && globalFields.length) {
							var fieldName = query.args.length && query.args[0];
							return _isObject(fieldName) || array.indexOf(globalFields, fieldName) === -1;
						}
						return isNotGlobal;
					});
				} else {
					if (array.indexOf(exports.globalOperators, name) !== -1) {
						if (array.indexOf(usedMap, name) === -1) {
							usedMap.push(name);
							globalOpts.push(query);
						}
					}
					var fieldName = query.args.length && query.args[0];
					if (array.indexOf(globalFields, fieldName) !== -1) {
						if (array.indexOf(usedMap, fieldName) === -1) {
							usedMap.push(fieldName);
							globalOpts.push(query);
						}
					}
				}
			}
		}
		function _filterQuery(a) { //only non empty queries will be feeded
			return array.filter(a, function(o) {
				return !gobject.isEmpty(o);
			});
		}
		function _resolve(object, options, parsedQuery) {
			var propertyMapping = {
			// hold pointer to actual item of array
			// used for mapping array into template
			// ex.:	ge(changed,*)&le(changed,*)
			//		changed: [2, 3]
			//		ge(changed,2)&le(changed,3)
			};
			resolveArgs(object, options, false, propertyMapping, parsedQuery);
			return postprocessing(object, options, parsedQuery);

			function postprocessing(object, options, /*query.Query*/query) {
				_cleanUp(null, query);
				_resolveOperations(object, options, query);
				_resolveValues(object, query);
				return query;

				function _cleanUp(parent, query) {
					if (typeof query == "object") {
						var args = query.args, name = query.name;
						if (/(?:and|or)Opt/.exec(name)) {
							array.forEach(args, function(a) {
								parent.push(a); // arg will be pushed into args prop, see line 220 in rql/query.js
							});
							parent.args = _deleteUnresolved(parent.args); // this removes empty andOpt|orOpt
						} else if (array.some(args, _isObject)) {
							array.forEach(args, lang.partial(_cleanUp, query));
						}
					}
				}
				function _resolveOperations(object, options, query) {
					if (typeof query == "object") {
						var args = query.args, name = query.name;
						// last argument should be array with posible operations
						if (name === "operation" && args[args.length - 1] instanceof Array) {
							// will remove list of posible operations
							_resolveOperation(query, args[0], args[1], args.pop(), options._operation);
						} else if (array.some(args, _isObject)) {
							array.forEach(args, lang.partial(_resolveOperations, object, options));
						}
						if (query.name === "operation") {
							throw new URIError(string.substitute("Operation for '${0}' property is not defined", [
								args[0]
							]));
						}
					}
					function _resolveOperation(query, opName, value, operations, opMap) {
						if (opMap && typeof opMap === "object" && opName in opMap) {
							var o = opMap[opName];
							if (array.indexOf(operations, o) >= 0) {
								query.name = _resolveOperator(value, o, operations, query);
							} else {
								throw new URIError(string.substitute("Operation '${0}' for '${1}' property is not allowed", [
									o,
									args[0]
								]));
							}
						} else if (operations.length) {// first one
							query.name = _resolveOperator(value, operations[0], operations, query);
						}
						function _resolveOperator(value, operator, others, query) { /*jshint laxbreak:true*/
							if (operator !== "eq") { // equal operator
								return operator;
							}
							var index;
							if (value === null) { // null only
								index = array.indexOf(others, "isnull");
								// use 'isnull' instead of requested 'eq' operator
								index !== -1 && (query._originalName = operator); // [1] keep original name for postprocessing
								return index !== -1 ? others[index] : operator;
							}
							if (value instanceof Array) { // array
								index = array.indexOf(others, "in");
								if (index !== -1) {
									// use 'in' instead of requested 'eq' operator
									return others[index];
								}
								index = array.indexOf(others, "out");
								if (index !== -1) {
									// use 'out' instead of requested 'eq' operator
									return others[index];
								}
							}
							// like processing for not null values only
							index = array.indexOf(others, "cdiLike");
							if (index === -1) {
								index = array.indexOf(others, "ciLike");
							}
							if (index === -1) {
								index = array.indexOf(others, "like");
							}
							if (index === -1) { // like/ciLike/cdiLike not allowed
								return operator;
							}
							return typeof value === "string" && value.match(/[%_*]/) // value is string and contains '%' or '_'
							? others[index] : operator; // use 'cdiLike'/'ciLike'/'like' instead of requested 'eq' operator
						}
					}
				}

				function _resolveValues(object, query) {
					if (typeof query == "object") {
						var args = query.args, name = query.name;
						// last argument should be array with posible operations

						if (/isnull/i.exec(name) && query._originalName) { // only one parameter should be defined for isnull operation (eq operator before), see [1]
							args.length = 1;
						} else if (/like/i.exec(name)) { // any like
							args[1] = _replace(args[1], "*", "%");
						} else if (array.some(args, _isObject)) {
							array.forEach(args, lang.partial(_resolveValues, object));
						}
					}
					function _replace(value, search, replace) {
						if (value instanceof RegExp) {
							value = value.toString();
						}
						return value && value.replace(RegExp(_escapeRegExp(search), "g"), replace);

						function _escapeRegExp(str) {
							return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
						}
					}
				}
			}
		}
	}

	exports.feed = feed;

	return exports;
});