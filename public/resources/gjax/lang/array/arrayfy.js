define([
	"dojo/has",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojox/lang/functional", 
	//
	"dojox/lang/functional/fold"
], function(has, lang, darray, df) {

	// TODO: add es6 features as well ? see find findIndex etc...
	
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach

	// exposed as has, for developers to be able configure as false/true in dojo config
	// applies only at frs module load !
	has.add("es5-array-forEach", function() {
		return !!Array.prototype.forEach;
	});

	// we have two implementations
	// module returns chosen implementation (function)
	// and all 2 other implementations as well 
	return lang.mixin(has("es5-array-forEach") ? _identity : _dojo, {
		dojo : _dojo,
		identity : _identity
	});

	function _identity(arr) {
		return arr;
	}

	/*
	TODO: finish  
	from kangax tables: 
	 	$ node cli.js es5 tests | jsontool -a name | grep Array\.proto | sort
			Array.prototype.every
			Array.prototype.filter
			Array.prototype.forEach
			Array.prototype.indexOf
			Array.prototype.lastIndexOf
			Array.prototype.map
			Array.prototype.reduce
			Array.prototype.reduceRight
			Array.prototype.some
		
	$ dojo supported, 
		# git grep -h ".*: function" _base/array.js | trim | cut -d":" -f1 | grep -v "^/" | sort
			clearCache
			every
			filter
			forEach
			indexOf
			lastIndexOf
			map
			some
			
	 They differ in 
	 	- reduce and reduce right, which are in df anyway			
		- sparse arrays
		- lambdas and strings support (dojo)
	*/

	function _dojo(arr) {

		function _dojoIfArr(a) {
			return a instanceof Array ? _dojo(a) : a;
		}

		function _decorate(arr, fName, wrapResult) {
			arr[fName] = wrapResult ? function(callback, thisArg) {
				return _dojo(darray[fName](arr, callback, thisArg));
			} : function(callback, thisArg) {
				return darray[fName](arr, callback, thisArg);
			};
		}
		
		function _processReduceArgs(/*callback, initialValue*/) {
			var args = Array.prototype.slice.call(arguments, 0);
			// if initialValue is used & is array then arrayfy it
			args.length > 1 && (args[1] = _dojoIfArr(args[1])); 
			args.unshift(arr);
			return args;
		}

		// arrayfy instance with dojo functions
		_decorate(arr, "forEach");
		_decorate(arr, "some");
		_decorate(arr, "every");
		_decorate(arr, "filter", true);
		_decorate(arr, "map", true);

		arr.reduce = function(/*callback, initialValue*/) {
			var args = _processReduceArgs.apply(null, arguments);
			return _dojoIfArr(df.reduce.apply(null, args));
		};
		arr.reduceRight = function(/*callback, initialValue*/) {
			var args = _processReduceArgs.apply(null, arguments);
			return _dojoIfArr(df.reduceRight.apply(null, args));
		};
		
		return arr;
	}

});