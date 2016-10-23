define([
	"dojo/promise/all",
	"dojo/_base/lang",
	"gjax/lang/array/arrayfy"
], function(all, lang, arrayfy) {

	function _all(array) {
		// summary:
		//		same as dojo/promise/all with extra map, filter and forEach functions
		// example:
		//		before:
		// |	all([]).then(function(arr){return arr.map(function(a){return a;})}
		//		after:
		// |	all([]).map(function(a){return a});

		var promise = all(array);
		if (!(array instanceof Array)) {
			//TODO: object support
			return promise;
		}
		return _all.arrayfy(promise);
	}
	_all.arrayfy=function (promise) { //DO I need this on public api ?
		return lang.delegate(promise, {
			map : function(callback, thisArg) {
				return _all.arrayfy(this.then(function(arr) {
					return arrayfy(arr).map(callback, thisArg);
				}));
			},
			filter : function(callback, thisArg) {
				return _all.arrayfy(this.then(function(arr) {
					return arrayfy(arr).filter(callback, thisArg);
				}));
			},
			forEach : function(callback, thisArg) {
				return this.then(function(arr) {
					return arrayfy(arr).forEach(callback, thisArg);
				});
			}
		});
	};
	return _all;


});
