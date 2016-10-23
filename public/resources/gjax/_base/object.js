/**
 * created 25.5.2012
 * 
 * @author mrepta
 * @description simplify work with object.
 */
define([
	"dojo/_base/lang",
	"dojo/_base/array",
	"gjax/collections/indexOf",
	"gjax/Collections",
	"gjax/_base/kernel",
	"gjax/_base/date"
], function(lang, array, indexOf, collUtils, gkernel, gdate) {

	function isEmpty(/*Object*/o) {
		// summary:
		//		Checks if object has any property/function, including "inherited".
		var i; //declated just to prevent jshit unused error
		for (i in o) {
			return false;
		}
		return true;
	}

	var EMPTY_VALUES = [ //default filter, used by filter and isEmptyValue
		"",
		null,
		undefined,
		NaN,// used by filter only
		{}
	// used by filter only
	];
	function isEmptyValue(value) {
		// summary:
		//		exposed to ensure consistency with filter(), and avoiding building useless objects for filter
		// returns: Boolean
		//		true if one of "", null, undefined, NaN
		return !!~indexOf(EMPTY_VALUES, value) || value != value;
	}
	function hasNonEmptyProperty(o) {
		// summary:
		//		Checks if object has any property that is not empty.
		var i;
		for (i in o) {
			if (!isEmptyValue(o[i])) {
				return true;
			}
		}
		return false;
	}
	function filter(o, constraints) {
		// summary:
		//		Removes/filters-out some properties from object based on their values.
		//		This function is usually used to properly filter unnecessary fields from json object
		//		as a results returns object which contains only properties that 
		//		does not match filtering constraints.
		//		Useful mainly before usage of objectToQuery method 
		//		because we do not want to send empty query parameters.
		// o: Object
		//		Object to process.
		// constraints: []?
		//		Array of property values which should be removed.
		//		Usual values include ["", null, undefined, NaN].
		// arrayFiltration: Boolean?
		//		Set true, if you want to filter nested arrays. Default value is false to preserve original functionality.
		// returns: Object
		//		Modified original object.

		/*jshint maxcomplexity:50 */// NTH try to rewrite?
		var _filter = constraints instanceof Array ? constraints : EMPTY_VALUES;
		var filterEmptyObj = false, filterEmptyArray = false, filterNaN = false, el;
		// find [], {} and NaN in constraints
		for ( var j = 0, l = _filter.length; j < l; j++) {
			el = _filter[j];
			if (el !== el) { // NaN
				filterNaN = true;
			}
			if (el) {
				if (isEmpty(el)) { // array or object
					if (lang.isArray(el)) {
						filterEmptyArray = true;
					} else if (lang.isObject(el) && !gdate.isDate(el)) {
						filterEmptyObj = true;
					}
				}
			}
		}

		if (_filter.length) {
			for ( var prop in o) {
				if (o[prop] && lang.isArray(o[prop])) {
					for ( var index in o[prop]) {
						o[prop][index] = filter(o[prop][index], _filter);
					}
					if (filterEmptyObj) {
						// delete empty objects from array
						for ( var i = o[prop].length - 1; i >= 0; i--) {
							if (lang.isObject(o[prop][i]) && isEmpty(o[prop][i])) {
								o[prop].splice(i, 1);
							}
						}
					}
					if (filterEmptyArray && isEmpty(o[prop])) {
						// delete empty array
						delete o[prop];
					}
				} else if (o[prop] && lang.isObject(o[prop]) && !gdate.isDate(o[prop]) && Object.prototype.toString.call(o[prop]) != "[object RegExp]") {// date is also object, but has any property
					o[prop] = filter(o[prop], _filter);
					if (filterEmptyObj && isEmpty(o[prop])) {
						// delete empty object
						delete o[prop];
					}
				} else if (filterNaN && o[prop] !== o[prop]) {
					// delete NaN
					delete o[prop];
				} else {
					if (~indexOf(_filter, o[prop])) { //contains
						delete o[prop];
					}
				}
			}
		}
		if (lang.isArray(o)) {
			// compact array
			o = collUtils.compact(o);
		}
		return o;
	}
	function filterTypeOf(/*Object*/o, constrains) {
		// summary:
		//		Removes/filters-out some properties from object based on their values
		// constrains: String[]?
		//		Types of properties to remove. 
		//		Available values are "object", "number", "function", "boolean", "array", "undefined", "null", "date"
		// returns: Object
		//		Original object (with removed attributes)

		//TODO: consider NaN behavior
		var _filter = constrains instanceof Array ? constrains : [];
		if (_filter.length) {
			for ( var prop in o) {
				if (~indexOf(_filter, _resolveType(o[prop]))) { //if contains
					delete o[prop];
				}
			}
		}
		return o;
	}

	function _resolveType(o) {
		if (Object.prototype.toString.call(o) == "[object Object]") {
			return "object";
		} else if (gdate.isDate(o)) {
			return "date";
		} else if (o instanceof Array) {
			return "array";
		} else if (o === null) {
			return null;
		} else if (gkernel.isNumber(o)) {
			return "number";
		} else {
			return typeof o;
		}
	}

	function call(objects, methodNameOrFnc/*, args..*/) {
		// summary:
		//		Use to execute same method on each object or to call function on each object.
		// description:
		//		If method name is provided, each object is checked for method presence. When not present,
		//		undefined is placed in return value array. 
		// objects: Object[]|Object
		//		Array of objects or single object to use as function context.
		// methodNameOrFnc: String|Function
		//		Method name or function.
		// args: Any...
		//		Any arguments that should be send to method/function call.
		// returns: Array[]
		//		Array of return values. When call does not return anything (or function/method does not exist),
		//		array of undefined values is returned.
		//		Length of returned array always matches length of `objects` array.
		// example:
		//		Using array.map():
		//	|	var trimmedStrings = array.map([strings], function(s) {
		//	|		return s.trim();
		//	|	});
		//		Using gobject.call():
		//	|	var trimmedStrings = gobject.call([strings], "trim");

		// normalize
		objects = objects == null ? [] : lang.isArray(objects) ? objects : [
			objects
		];

		var args = Array.prototype.slice.call(arguments, 2);
		var f = typeof methodNameOrFnc == "function" && methodNameOrFnc;

		return array.map(objects, function(o) {
			var ff = f || (o && o[methodNameOrFnc]);
			return o && typeof ff == "function" ? ff.apply(o, args) : undefined;
		});
	}

	//hierarchically mix source into destination
	function nestedMixin(dest, source) {
		for ( var p in source) {
			if (dest.hasOwnProperty(p)) {
				if (Object.prototype.toString.call(dest[p]) === "[object Object]") {
					dest[p] = nestedMixin(dest[p], source[p]);
				} else {
					dest[p] = source[p];
				}
			} else {
				dest[p] = source[p];
			}
		}
		return dest;
	}

	function _toArr(v) {
		return typeof v == "string" ? v.split(/\s*,\s*/) : v;
	}

	function remap(o, inKeys, outKeys) {
		// summary:
		//		Use to create object with renamed keys.
		// description:
		//		A complete description of the function or object. Will appear in place of summary.
		// inKeys: Array[]|String
		//		Array of attributes to be remapped. Optionally can be specified as comma-delimited string.
		//		Values of these attributes will be present in returned object, but with other keys.
		//
		//		If this array is longer than `outKeys`, any extra attributes will be ignored.
		// outKeys: Array[]?|String?
		//		Array of new attribute names. Optionally can be specified as comma-delimited string.
		//		When not present, `inKeys` is used.
		//		
		//		If this array is longer than `inKeys`, any extra names will be ignored.
		// returns:	Object
		//		New object, `o` is not modified.
		// example:
		//	|	var source = {
		//	|		id : 1,
		//	|		name : "Joe",
		//	|		date : "2012-01-01"
		//	|	};
		//	|	var target = gobject.remap(["id", "name", "name2"], ["partId", "firstName", "surname"]);
		//	|	// target now looks like this:
		//	|	// 	{
		//	|	//		partId : 1,
		//	|	//		firstName : "Joe",
		//	|	//		date : "2012-01-01"	// this was not remapped, also surname is not present
		//	|	//	}
		
		/*jshint expr:true */
		inKeys = _toArr(inKeys);
		outKeys = _toArr(outKeys) || inKeys;

		var t = {};
		for ( var k in o) {
			var kk = outKeys[indexOf(inKeys, k)] || k;
			kk && (t[kk] = o[k]);
		}
		return t;
	}

	return {
		isEmpty : isEmpty,
		isEmptyValue : isEmptyValue,
		filter : filter,
		filterTypeOf : filterTypeOf,
		remap : remap,
		call : call,
		hasNonEmptyProperty : hasNonEmptyProperty,
		nestedMixin : nestedMixin
	};
});
