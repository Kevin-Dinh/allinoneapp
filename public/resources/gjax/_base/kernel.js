/**
* minimal gjax kernel
*/
define([
	// partial APIs
	"gjax/_base/date",
	"gjax/_base/number",
	// support
	"dojo/_base/lang",
	"exports"
], function(gdate, gnumber, dlang, exports) {

	var _this = {

		asrt : function(condition, msg) {
			// summary:
			//		Throws specialized Error with AssertionError as name if condition is not satisfied (truthy value)
			// condition: boolean | Any
			//		Condition, or value to check, prefere conversion to boolean in your code.
			//		method performs if(!condition) throw
			// returns: boolean
			//		True for thruthy values, false for falsy values,
			//		one known exception Invalid Date is treated as true !
			if (!condition) {
				var e = new Error("Assertion failed: " + msg);
				e.name = "AssertionError";
				throw e;
			}
		},
		// TODO remove, legacy code
		isDate : gdate.isDate,
		today : gdate.today,
		toISOString : gdate.toISOString,

		noop : function() {
			// summary:
			//		Empty function
			// description:
			//		Function which does not do anything does not return anything.
			//		Intended to be usedas callback (e.g dfd.then(kernel.noop,errorBack))
			//		(note: there is no such API in Dojo).
		},
		identity : function(param) {
			// summary:
			//		Functions that return passed argument.
			// description:
			//		Function which does not do anything and returns passed argument.
			//		Intended to be usedas callback (e.g dfd.then(kernel.identity,errorBack))
			//		(note: there is no such API in Dojo).
			// arg: Any
			//		Value that will be returned.
			// returns:
			//		Passed argument
			return param;
		},
		returnValue : function(val) {
			// summary:
			//		Convenience method for callback returning scoped var
			// description:
			//		Usage promise.then(returnValue(scopedVar))
			return function() {
				return val;
			};
		},
		spread : function(fn) {
			// summary:
			//		Convenience method for .then callback, which will flatten passed array as separate arguments
			// description:
			//		Usage all([a,b]).then(spread(function(a,b){}))
			return function(result) {
				return fn.apply(null, result);
			};
		}
	};

	exports.asrt = _this.asrt; //to break circular dependency with number.js

	dlang.mixin(_this, gnumber);
	return _this;
});