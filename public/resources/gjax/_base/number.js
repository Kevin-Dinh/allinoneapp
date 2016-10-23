define([
	// partial APIs    
	"gjax/number/es6",
	// support
	"gjax/_base/kernel",
	"dojo/_base/lang"
], function(es6num, gkernel, dlang) {

	var _this = {

		isNumber : function(n) {
			// summary:
			//		Checks if n is "valid" number or Number.
			//		NaN is eliminated (returns false).
			//		Eliminates cross-window issues.
			// n: Any
			//		Something to check
			// returns: boolean
			//		Valid "number" or Number() returns true.
			//		Infinites return true as well.
			//		NaN, strings, null, undefined, Dates or else returns false.
			return ((typeof n == "number" || Object.prototype.toString.call(n) == "[object Number]") /*jshint laxbreak:true */
			&& n === n); //!isNaN, fast
		},

		isFiniteNum : function(n) {
			// summary: 
			//		convenience for: _this.isNumber(n) && isFinite(n);
			//		same as toFiniteNum, num just return boolean not throws
			// return: boolean
			return _this.isNumber(n) && isFinite(n);
		},

		toFiniteNum : function(n) {
			// summary:
			//		Sanitization function for numbers
			//		Asserts that isNumber(n) && isFinite(n)
			// n: number
			//		Number to sanitize
			// returns: number
			//		Throws when not finite number

			gkernel.asrt(_this.isFiniteNum(n), "toFiniteNum(), supplied parameter n is not 'finite number'");
			return +n; // Number -> number if needed
		},

		nvl : function(n, def) {
			// summary:
			//		Sanitization function for numbers and 'Null Value',
			//		Replaces null and undefined values with supplied default value (another number)
			// n: number|null|undefined
			//		Value to check
			// def:
			//		Can be num(), but also null, undefined or NaN
			// returns: number
			//		Returns `n` or `def`.
			//		Throws if `def` is invalid (do not use 'strings' as defaults)
			//		or if `n` is not num()
			if (n == null /* or undefined */) {
				def == null || def !== def || (def = _this.num(def));
				return def;
			}
			return _this.num(n);
		},

		nanvl : function(n, def) {
			// summary:
			//		Sanitization function for numbers. 'Not A Number value'
			//		Replaces non number values (see num())
			//		with defaults value
			// n: Any
			//		Value to check
			// def: number|Any
			//		Default can be anything, number, string, null, undefined, whatever.
			try {
				return _this.num(n);
			} catch (ex) {
				return def;
			}
		},

		sum : function(/*=====arr, propOrTransform=====*/) {
			// summary:
			//		Sums floating point numbers without rounding errors.
			// arr: Array
			//		Array of numbers/objects to sum. Can be also used without array, see the last example.
			// prop: String|Function?
			//		Is `arr` does not contain numbers, `prop` is name of property to sum. Optionaly it can be a function that will
			//		transform array items to number. 
			// returns:	Number
			//		Total.
			// example:
			//		Plain sum:
			//	|	number.sum([0.1, 0,2]); // result is 0.3, compare with native result: 0.30000000000000004
			// example:
			//		Summing object properties
			//	|	number.sum([
			//	|		{
			//	|			rate : 0.1
			//	|		},
			//	|		{
			//	|			rate : 0.2
			//	|		},
			//	|		{
			//	|			dog : 0.3 // // "rate" not found, ignored
			//	|		}
			//	|	], "rate")); // result is 0.3
			// example:
			//		Summing using transformer function
			//	|	number.sum([
			//	|		{
			//	|			useLowRate : true,
			//	|			lowRate : 0.1,
			//	|			highRate : 0.7
			//	|		},
			//	|		{
			//	|			useLowRate : false,
			//	|			lowRate : 0.6,
			//	|			highRate : 0.2
			//	|		}
			//	|	], function(o) {
			//	|		return o[o.useLowRate ? "lowRate" : "highRate"];
			//	|	}))); // result is 0.3
			// example:
			//		All previous examples can be rewritten without using array-less syntax:
			//	|	number.sum(0.1, 0,2); // result is 0.3
			//	|	number.sum({rate : 0.1}, {rate : 0.2}, {dog : 0.3}, "rate"); // result is 0.3

			// process params
			var arr, propOrTransform;
			var lastArg = arguments[arguments.length - 1];
			if (typeof lastArg == "string" || typeof lastArg == "function") {
				// "propOrTransform" is used
				propOrTransform = lastArg;
				arr = Array.prototype.slice.call(arguments, 0, -1);
			} else {
				arr = Array.prototype.slice.call(arguments, 0);
			}
			// check if array syntax is used, i.e. sum([]) or sum([], prop)
			arr.length == 1 && arr[0] instanceof Array && (arr = arr[0]);

			// now actual work
			var sum = 0, nums = extractNumbers(arr, propOrTransform);
			for ( var i = 0; i < nums.length; i++) {
				sum += nums[i];
			}
			return +sum.toFixed(nums._maxDecimal);

			function extractNumbers(arr, prop) {
				// extracts numbers from array (by prop or transform)
				// also finds maximal decimal length
				var nums = [];
				nums._maxDecimal = 0;
				for ( var i = 0; i < arr.length; i++) {
					var o = arr[i];
					var n = (typeof prop == "function" ? prop(o, i, arr) // if we have transformer, use it
					: !isNaN(o) ? o // of input is number, use it
					: (o && typeof o == "object" && prop) ? o[propOrTransform] // if input is object and we have prop, use it
					: 0) || 0;
					
					var dec = ("" + n).match(/\.(\d+)/);
					nums._maxDecimal = Math.max(nums._maxDecimal, dec ? dec[1].length : 0);
					nums.push(n);
				}
				return nums;
			}
		}
	};
	// alias
	_this.num = _this.toFiniteNum;
	// add es6 APIs
	dlang.mixin(_this, es6num);

	return _this;
});