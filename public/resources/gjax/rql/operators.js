define([
	"dojo/_base/lang",
	"dojo/_base/array",
	"rql/js-array-compat",
	"gjax/_base/object",
	"gjax/collections/compare"
], function(lang, darray, rql, gobject, gcompare) {

	// summary:
	//		This module extends rql operators defined in js-array.

	// description:
	//		Adds new operators and extends existing one to work with object.
	//		If you want use this extended version of operators
	//		include this with RQL related libraries.
	//
	//		List of extended operators:
	//			select()
	//			unselect()
	//			values()
	//		List of fixed operators:
	//			sort()
	//		List of new operators:
	//			pick()
	//			omit()
	//			has()
	//			hasNot()
	//			recurse2()
	//			unwind()
	//			reverse()
	//			project()
	//			call()
	//			join()
	//			remapValue()
	//		For detailed description see unit-test.

	// Note: See rql.md for example usage and more other information.

	function _filter(properties, has, o) {
		if (typeof o != "object" || gobject.isEmpty(o)) {
			return false;
		}
		var p, i = 0;
		while ((p = properties[i++])) {
			if ((has && !(p in o)) || (!has && (p in o))) {
				return false;
			}
		}
		return true;
	}

	function _callFn(fn, args) {
		if (this instanceof Array) {
			return darray.map(this, function(item) {
				return fn.apply(item, args);
			});
		}
		return fn.apply(this, args); // as object
	}

	var operators = rql.operators, // 
	selectOrig = operators.select, //
	unselectOrig = operators.unselect, //
	valuesOrig = operators.values;

	var slice = Array.prototype.slice;

	lang.mixin(operators, {
		// keep original operators backup
		selectOrig : selectOrig,
		unselectOrig : unselectOrig,
		valuesOrig : valuesOrig,

		// ---------------------------------------------------------------------
		// extending existing operators

		select : function() {
			var args = arguments;
			var argc = arguments.length;
			return darray.map(this, function(object) {
				var selected = {};
				for ( var i = 0; i < argc; i++) {
					var propertyName = args[i];
					var value = rql.evaluateProperty(object, propertyName);
					if (propertyName instanceof Array) {
						var a = selected, l = propertyName.length; /*jshint loopfunc:true*/
						darray.forEach(propertyName, function(k, i) { // making function within loop
							if (!(k in a)) {
								a[k] = (l - 1 === i) ? value : {}; // if last set value
							}
							a = a[k];
						});
					} else {
						if (typeof value != "undefined") {
							selected[propertyName] = value;
						}
					}
				}
				return selected;
			});
		},

		unselect : function() {
			var args = arguments;
			var argc = arguments.length;
			return darray.map(this, function(object) {
				var selected = {};
				for ( var i in object) {
					if (object.hasOwnProperty(i)) {
						if (typeof object[i] == "object") { // must be cloned
							selected[i] = lang.clone(object[i]);
						} else {
							selected[i] = object[i];
						}
					}
				}
				for ( var j = 0; j < argc; j++) {
					if (!(args[j] instanceof Array)) {
						delete selected[args[j]];
					} else { // handle nested properties
						var nested = selected;
						for ( var k = 0; k < args[j].length; k++) {
							if (!nested[args[j][k]]) {
								break;
							}
							if (k < args[j].length - 1) {
								nested = nested[args[j][k]];
							} else {
								delete nested[args[j][k]];
							}
						}
					}
				}
				return selected;
			});
		},

		values : function(/*first*/) {
			if (typeof this == "object" && !(this instanceof Array)) {
				var values = valuesOrig.apply([
					this
				], arguments);
				// make sure that array of values returns
				if (arguments.length > 1 || arguments.length === 0) {
					return values.pop();
				}
				return values;
			}
			return valuesOrig.apply(this, arguments);
		},
		
		// ---------------------------------------------------------------------
		// fixed operators
		sort : function() {
			var terms = [];
			for ( var i = 0; i < arguments.length; i++) {
				var sortAttribute = arguments[i];
				var firstChar = sortAttribute.charAt(0);
				var term = {
					attribute : sortAttribute,
					ascending : true
				};
				if (firstChar == "-" || firstChar == "+") {
					if (firstChar == "-") {
						term.ascending = false;
					}
					term.attribute = term.attribute.substring(1);
				}
				terms.push(term);
			}
			this.sort(function(a, b) {
				for ( var term, i = 0; (term = terms[i]); i++) {
					// JU: fix is here, orignal sort was inconsistent e.g. when comparing numbers with falsy values
					var result = gcompare.byProperty(term.attribute)(a, b);
					return term.ascending ? result : -result;
				}
				return 0;
			});
			return this;
		},

		// ---------------------------------------------------------------------
		// new operators

		pick : function() {
			// Return a copy of the object only containing the whitelisted properties.
			// Required extended select operator
			// inspirated by 
			// 		http://underscorejs.org/underscore.js: _.pick()
			return operators.select.apply([
				this
			], arguments)[0];
		},

		omit : function() {
			// Return a copy of the object without the blacklisted properties.
			// Required extended unselect operator
			// inspirated by 
			// 		http://underscorejs.org/underscore.js: _.omit()
			return operators.unselect.apply([
				this
			], arguments)[0];
		},

		has : function() {
			return darray.filter(this, lang.partial(_filter, slice.call(arguments, 0), true));
		},

		hasNot : function() {
			return darray.filter(this, lang.partial(_filter, slice.call(arguments, 0), false));
		},

		recurse2 : function(property, removeOriginals) {
			var newResults = [];
			function recurse(value) {
				if (value instanceof Array) {
					darray.forEach(value, recurse);
				} else {
					if (!removeOriginals) {
						newResults.push(value);
					}
					if (property) {
						value = value[property];
						if (value && typeof value == "object") {
							if (removeOriginals) {
								if (value instanceof Array) {
									Array.prototype.push.apply(newResults, value);
								} else {
									newResults.push(value);
								}
							}
							recurse(value);
						}
					} else {
						for ( var i in value) {
							if (value[i] && typeof value[i] == "object") {
								recurse(value[i]);
							}
						}
					}
				}
			}
			recurse(this);
			return newResults;
		},

		unwind : function(property, newPropertyName) {
			// transform array data to „flat“
			var results = [];
			if (this instanceof Array) {
				darray.forEach(this, _unwind);
			} else {
				_unwind(this); // as object
			}
			return results;
			function _unwind(object) {
				var a = object[property], //
				unwindObj = lang.mixin({}, object);
				delete unwindObj[property];
				if (!a) {
					results.push(unwindObj);
				} else {
					darray.forEach(a, function(item) {
						var o = {};
						if (typeof item === "object") {
							if (newPropertyName) { // store in prop name
								o[newPropertyName] = item;
							} else { // mix to existing object
								o = lang.mixin({}, item);
							}
						} else {
							o[newPropertyName || property] = item;
						}
						results.push(lang.mixin({}, unwindObj, o));
					});
				}
			}
		},

		reverse : function() {
			// reverse key and values on objects (traverse arrays too)
			// works on array and object
			var omitArgs = slice.apply(arguments);
			if (this instanceof Array) {
				return darray.map(this, _reverse);
			}
			return _reverse(this); // as object
			function _reverse(object) {
				var reverseObj = {};
				for ( var i in object) {
					if (darray.indexOf(omitArgs, i) < 0) {
						var val = object[i];
						if (typeof val === "object" && !(val instanceof Array)) {
							reverseObj[i] = _reverse(val);
						} else if (val instanceof Array) {
							reverseObj[i] = darray.map(val, _reverse);
						} else {
							reverseObj[val] = i;
						}
					}
				}
				return reverseObj;
			}
		},

		project : function(tmplName) {
			var tmpl = rql.templates[tmplName];
			if (!tmpl) {
				throw new Error("Template " + tmplName + " is not defined");
			}
			if (this instanceof Array) {
				return darray.map(this, lang.partial(_project, tmpl));
			}
			return _project(tmpl, this); // as object
			function _project(tmpl, object) {
				var o = {};
				for ( var i in tmpl) {
					var val = tmpl[i];
					if (typeof val === "object" && !(val instanceof Array)) {
						o[i] = _project(val, object);
					} else if (val[0] === '$') {
						o[i] = _resolve(object, val.substring(1));
					} else {
						o[i] = object[i] || val;
					}
				}
				return o;
			}
			function _resolve(obj, ref) { // resolving will be run on root object
				var params = ref.split("/");
				// pick value of defined property
				return rql.evaluateProperty(operators.pick.call(obj, params), params);
			}
		},

		call : function(/*property, filter functions */) {
			function _call(property/*, filter functions */) {
				var args = Array.prototype.splice.call(arguments, 1), // first is property
				obj = lang.mixin({}, this), fn, o;
				while ((fn = args.shift()) != null) { /*jshint expr:true */
					o = lang.getObject(property, false, obj);
					o && lang.setObject(property, fn.call(o), obj);
				}
				return obj;
			}
			if (this instanceof Array) {
				var args = arguments;
				return darray.map(this, function(item) {
					return _call.apply(item, args);
				});
			}
			return _call.apply(this, arguments); // as object
		},

		join : function(/*property, joinWith*/) {
			if (this instanceof Array) {
				var args = arguments;
				return darray.map(this, function(item) {
					return _fn.apply(item, args);
				});
			}
			return _fn.apply(this, arguments); // as object
			function _fn(property, joinWith) {
				if (this instanceof Array) {
					return Array.prototype.join.call(this, joinWith || property);
				} else {
					var o = lang.clone(this);
					if (property in o) {
						o[property] = Array.prototype.join.call(o[property], joinWith);
					}
					return o;
				}
			}
		},

		remapValue : function(find, replace) {
			_testArgs(find, replace);
			return _callFn.call(this, _remap, arguments);
			function _remap(find, replace) {
				var o = lang.clone(this);
				for ( var i in o) {
					if (o[i] === find) {
						o[i] = replace;
					}
				}
				return o;
			}
			function _testArgs(find, replace) {
				// null is ok
				if ((find && typeof find == "object") || (replace && typeof replace == "object")) {
					throw new Error("Only primitive type can be used as value for remap.");
				}
			}
		},
		
		matchNot : rql.filter(function(value, regex) {
			return !(new RegExp(regex).test(value));
		})
	});
});
