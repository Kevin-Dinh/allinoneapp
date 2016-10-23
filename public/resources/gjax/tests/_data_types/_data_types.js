// written for node.js, TODO: use from screen unit test, remove logs and display formated returned result
// jsontool -a data teststests._.isObject tests.
console.debug = console.warn;
/*jshint unused:false*/
/*jshint -W053 */ //allow new Number(0), new Boolean(),...
require([
	"dojo/_base/lang",
	"dojo/number",
	"gjax/_base/date",
	"gjax/_base/kernel",
	"gjax/_base/object",
	"dojo/json",
	"gjax/node!util"
//,"dojo/query" // for testing NodeList - not possible to use in node env - document not found

], function(lang, dnumber, gdate, gkernel, gobject, json, util/*, query*/) {

	function _instanceOf(what) {
		return function(it) {
			return it instanceof what;
		};
	}

	function C() {

	}

	var data = {
		"null" : null,
		"undefined" : undefined,
		"NaN" : NaN,
		"Date" : new Date(),
		"Date(NaN)" : new Date("fooBar"),
		"'2005-12-12'" : "2005-12-12",
		// functions
		"function" : function() {
		},
		"console.log" : console.log,
		//strs
		"string" : "string",
		"''" : "",
		"String('String')" : new String('String'), //NOSONAR
		"String('')" : new String(''), //NOSONAR
		"'null'" : 'null',
		//bools
		"false" : false,
		"true" : true,
		"'true'" : 'true',
		"'false'" : 'false',
		"Boolean(false)" : new Boolean(false), //NOSONAR
		"Boolean(true)" : new Boolean(true), //NOSONAR
		//nums
		"0" : 0,
		"1" : 1,
		"1.567" : 1.567,
		"'1.567'" : "1.567",
		"'100a200'" : "100a200",
		"new Number(0)" : new Number(0), //NOSONAR
		"new Number(1)" : new Number(1), //NOSONAR
		"Number(1)" : Number(1), //NOSONAR
		"Infinity" : Infinity,
		"-Infinity" : -Infinity,
		"Long.MAX" : 9007199254740992,
		"Long.MAX+2" : 9007199254740994,
		"'1/0'" : "1/0",
		"{}" : {},
		"{a:10}" : {
			a : 10
		},
		"{0:'a'}" : {
			0 : "a"
		},
		"newC" : new C(),
		"[]" : [],
		"[123]" : [
			123
		],
		"[2,3,4]" : [
			2,
			3,
			4
		],
		"arguments" : arguments,
		//"query()" : query("selector"),
		"/re/" : /aaa/gim,
		"RegExp('re')" : new RegExp("aaa", "gim")
	};
	//isNaN
	var tests = {
		"!!" : function(o) {
			return !!o;
		},
		"!!vs==" : function(o) { 
			var boolO = !!o;
			/*jshint -W041*/
			return o == true && boolO != true || o == false && boolO != false;
			/*jshint +W041*/
		},
		"o_valueOf" : function(o) {
			return o == null ? o : (o.valueOf() + " [" + (typeof o.valueOf()) + "]");
		},
		"valueOf" : function(o) {
			try {
				return o.valueOf();
			} catch (ex) {
				return "throws";
			}
		},
		"typeof" : function(o) {
			return typeof o;
		},
		"Object_toString" : function(value) {
			return Object.prototype.toString.apply(value);
		},
		"value_toString" : function(value) {
			try {
				return value.toString();
			} catch (ex) {
				return "throws";
			}
		},
		"value+''" : function(value) {
			try {
				return value + '';
			} catch (ex) {
				return "throws";
			}
		},
		"isNaN" : isNaN,
		"!isNaN" : function not_isNaN(it) {
			return !isNaN(it);
		},
		"templates_isNaN" : function(o) {
			return o !== o;
		},
		"inst_Object" : _instanceOf(Object),
		"lang_isObject" : lang.isObject,
		"__isObject" : function(obj) { // from underscore
			return obj === Object(obj);
		},
		"lang_isString" : lang.isString,
		"templates_isObject" : function(it) {
			return Object.prototype.toString.apply(it) == "[object Object]";
		},
		"inst_Function" : _instanceOf(Function),
		"lang_isFunction" : lang.isFunction,
		"inst_Array" : _instanceOf(Array),
		"lang_isArray" : lang.isArray,
		"lang_isArrayLike" : lang.isArrayLike,
		"Array_isArray" : Array.isArray, // ES5
		"es5-ext_isPlainArray" : function(obj) {
			// https://github.com/medikoo/es5-ext/blob/master/array/is-plain-array.js
			var isArray = Array.isArray, getPrototypeOf = Object.getPrototypeOf;
			if (!obj || !isArray(obj)) {
				return false;
			}
			var proto = getPrototypeOf(obj);
			if (!isArray(proto)) {
				return false;
			}
			return !isArray(getPrototypeOf(proto));
		},
		//		"npm_isarray_module" : function(arr) {
		//			// CP from: https://github.com/juliangruber/isarray/blob/master/index.js
		// same as templates_isObject
		//			return Object.prototype.toString.call(arr) == '[object Array]';
		//		},
		"!!obj_length" : function(obj) { //sometimes used as incorrect check for array
			try {
				return !!obj.length;
			} catch (ex) {
				return "throws";
			}
		},
		"!!(obj_&&_obj_length)" : function(obj) { //sometimes used as incorrect check for array

			return !!(obj && obj.length);

		},
		"inst_Number" : _instanceOf(Number),
		"gkernel_isNumber" : gkernel.isNumber,
		"num" : function(it) {
			try {
				return gkernel.num(it);
			} catch (ex) {
				return "throws";
			}
		},
		"nvl" : function(it) {
			try {
				return gkernel.nvl(it, 999);
			} catch (ex) {
				return "throws";
			}
		},
		"nanvl" : function(it) {
			try {
				return gkernel.nanvl(it, 'default');
			} catch (ex) {
				return "throws";
			}
		},
		"es5-ext_isNumber" : function(x) {
			// https://github.com/medikoo/es5-ext/blob/master/number/is-number.js
			var toString = Object.prototype.toString, id = toString.call(1);
			return ((typeof x === 'number') || ((x instanceof Number) || ((typeof x === 'object') && (toString.call(x) === id))));
		},
		"+it" : function(it) {
			return (+it);
		},
		"parseInt(it)" : function(it) {
			return parseInt(it, 10);
		},
		"parseFloat(it)" : function(it) {
			return parseFloat(it);
		},
		"dnumber_parse" : function(it) {
			return dnumber.parse(it);
		},
		"isFinite" : isFinite,
		"it_or_zero" : function(it) {
			// other seen conversion to number (also with (it || 0) + "") variation
			return (it || 0);
		},
		"+it_or_zero" : function(it) {
			// just experiment
			return +(it || 0);
		},
		"finite_gNumber_or_null" : function(it) {
			// checks for number or Number and finite and converts possible Number to number
			return gkernel.isNumber(it) && isFinite(it) ? +it : null;
		},
		// TODO: add other number2string variations
		"inst_Date" : _instanceOf(Date),
		"gdate_isDate" : gdate.isDate,
		"util_isDate" : util.isDate,
		"gobject_isEmptyValue" : gobject.isEmptyValue,
		"gobject_isEmpty" : gobject.isEmpty,
		"Object_keys_length" : function(v) {
			try {
				return Object.keys(v).length;
			} catch (ex) {
				return "throws";
			}
		},
		"es5-ext_isBoolean" : function(x) {
			// https://github.com/medikoo/es5-ext/blob/master/boolean/is-boolean.js
			var toString = Object.prototype.toString, id = toString.call(true);
			return (typeof x === 'boolean') || ((typeof x === 'object') && ((x instanceof Boolean) || (toString.call(x) === id)));
		},
		"djson_stringify" : function(it) {
			var s = json.stringify(it);
			var t = typeof s;
			return json.stringify({
				s : s,
				t : t
			});
		},
		"djson_parse_stringify_it_equals_it" : function(it) {
			try {
				var it2 = json.parse(json.stringify(it));
				return typeof it === typeof it2 && it === it2;
			} catch (ex) {
				return "throws";
			}
		}

	};

	var r = {
		results : []
	};
	var d, t;
	for (d in data) {
		var rr = {
			data : d,
			tests : {}
		};
		r.results.push(rr);
		for (t in tests) {
			rr.tests[t] = tests[t](data[d]);
		}
	}

	var serializeNum = function(key, it) {
		var objtype = typeof it;
		if (objtype == "number") {
			return isNaN(it) ? "NaN" : !isFinite(it) ? (it < 0 ? "-" : "") + "Infinity" : it + "";
		}
		return it;
	};

	console.log(json.stringify(r, serializeNum, "\t"));

	return r;
});
