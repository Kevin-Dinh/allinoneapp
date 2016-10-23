define([
	"gjax/collections/indexOf",
	"dojo/_base/kernel"
], function(indexOf, kernel) {

	// module:
	//		gjax/Collections
	// summary:
	//		Convenience helper methods for array modification.

	var _indexOf = function(_this, value, i) {
		/*jshint curly:false*/
		var j;
		for (j = _this.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; i < j && _this[i] !== value; i++)
			;
		return j <= i ? -1 : i;
	};

	// from dojo/_base/lang, to avoid requiring it
	var _isArray = function(_this) {
		return _this && (_this instanceof Array);// || typeof _this == "array");
	};

	var Collections = {
		// summary:
		//		Convenience helper methods for array modification.

		removeAll : function(/*Array*/_this, /*Array*/that) {
			// summary:
			//		Removes from `_this` collection all of its elements that are contained
			//		in the specified collection `that`. If `_this` collection contains
			//		duplicit elements and one of them is contained in `that` all
			//		occurences from `_this` are removed.
			// returns: Array
			//		New collection, `_this` is not modified.
			for ( var i = 0, r = []; i < _this.length; i++) {
				if (_indexOf(that, _this[i]) == -1) {
					r.push(_this[i]);
				}
			}
			return r;
		},
		retainAll : function(/*Array*/_this, /*Array*/that) {
			// summary:
			//		Retains only the elements in `_this` collection that are contained in the
			// 		specified collection `that`. In other words, removes
			// 		from `_this` all the elements that are not contained in `that`.
			// returns: Array
			//		New collection, `_this` is not modified.
			for ( var i = 0, r = []; i < _this.length; i++) {
				if (_indexOf(that, _this[i]) != -1) {
					r.push(_this[i]);
				}
			}
			return r;
		},
		unique : function(/*Array*/_this, /*String?*/propName) {
			// summary:
			//		Removes all duplicit elements from `_this` collection.
			//		Optionally if `propName` is specified, `element.propName` is used to determine if elements are duplicit.
			// returns: Array
			//		New collection, `_this` is not modified.

			// TODO: more effective implementation ? convert arr to hash
			// TODO: shorter impl, but must be fast enough !
			var i = 0, r = [], p = [], l = _this.length;
			if (propName) {
				for (; i < l; i++) {
					if (_indexOf(p, _this[i][propName]) == -1) {
						p.push(_this[i][propName]);
						r.push(_this[i]);
					}
				}
			} else {
				for (; i < l; i++) {
					if (_indexOf(r, _this[i]) == -1) {
						r.push(_this[i]);
					}
				}
			}
			return r;
		},
		compact : function(/*Array*/_this) {
			// summary:
			//		Removes all null/undefined elements from `_this` collection.
			// returns: Array
			//		New collection, `_this` is not modified.
			var toret = [];
			for ( var i = 0; i < _this.length; i++) {
				if (_this[i] != null) {// este existuje moznost z undefined
					toret.push(_this[i]);
				}
			}
			return toret;
		},
		removeAt : function(/*Array*/_this, /*Integer*/index) {
			// summary:
			//		Removes element on `index` from `_this` collection.
			// returns: Array
			//		Modified collection.
			return _this.splice(index, 1);
		},

		indexOf : indexOf,
		/*=====
		indexOf : function(array, searchElement, fromIndex) {
			// summary:
			//		Cross-browser strict version of indexOf.
			// array: Array
			//		Array for lookup.
			// searchElement: Any
			//		Element te search for.
			// fromIndex: Integer?
			//		The index at which to begin the search. Defaults to 0. 
			// returns: Integer
			//		Index of `searchElement` in `array`, if found, -1 otherwise.
			// description:
			//		This method corresponds to the JavaScript 1.6 Array.indexOf method.
			//
			//		Dojo array.indexOf is inconsistent with Array.prrototype.indexOf.
			//		See http://bugs.dojotoolkit.org/ticket/16104
		},
		=====*/
		find : function(_this, what) { //TODO: testcase
			return _this[indexOf(_this, what)]; //undefined for -1
		},
		// TODO remove and replace with comparators
		sort : function(/*Array*/_this, /*String*/propName, /*Boolean*/sortDescending) {
			// summary:
			//		Sorts an array in place acording to received properties
			//		Optionally if `propName` is specified, `element.propName`, sort by it.
			//		Optionally if `sortDescending` is true, sort desc, else sort asc.
			// returns: Array
			//		`_this` is modified.

			kernel.deprecated("Collections.sort is deprecated. See source code.", "", "2.0");
			if (propName) {
				_this.sort(function(a, b) {/* git-qa */
					if (a[propName] === b[propName]) {
						return 0;
					}
					if (sortDescending === true) {
						return a[propName] > b[propName] ? -1 : 1;
					} else {
						return a[propName] > b[propName] ? 1 : -1;
					}
				});
			} else {
				_this.sort(function(a, b) {/* git-qa */
					if (a === b) {
						return 0;
					}
					if (sortDescending === true) {
						return a > b ? -1 : 1;
					} else {
						return a > b ? 1 : -1;
					}
				});
			}

			return _this;
		},

		equals : function(_this, that, equals) {
			// summary:
			//		Returns true if '_this' and 'that' arrays are equal.
			//		Array elements are compared using === operator
			// equals: Function?
			//		Optional function that should be use to compare array elements
			// returns: Boolean

			// NTH: Is there any "Date,NaN,etc."-aware equals function that could be sent here?
			if (_this === that) {
				return true; // quick exit for the same instance
			}
			if (!_isArray(_this) || !_isArray(that) || _this.length !== that.length) {
				return false;
			}

			var i = 0, l = _this.length;
			if (typeof equals == "function") {
				for (; i < l; i++) {
					if (!equals(_this[i], that[i])) {
						return false;
					}
				}
			} else {
				for (; i < l; i++) {
					if (_this[i] !== that[i] && !(_this[i] !== _this[i] && that[i] !== that[i])) {
						return false;
					}
				}
			}

			return true;
		},

		duplicates : function(_this, equals, ret) {
			// summary:
			//		Finds duplicate items in array. null and undefined values are ignored.
			// _this: Array
			//		Array to search for duplicates.
			// equals: Function
			//		Equals function to use for comparison. If not specified, == wil be used.
			// ret: String
			//		Choose what should be returned. Allowed values are "both" and "second". If "second" is specified, only second
			//		of duplicate items will be returned. If "both" is specified, both items will be returned. Defaults to "both".
			var duplicates = [];
			var l = _this.length;
			for ( var i = 0; i < l; i++) {
				var firstItem = _this[i];
				if (firstItem != null) {
					for ( var j = i + 1; j < l; j++) {
						var otherItem = _this[j];
						if (otherItem && equals ? equals(firstItem, otherItem) : firstItem == otherItem) {
							if (ret != "second") {
								duplicates.push(firstItem);
							}
							duplicates.push(otherItem);
						}
					}
				}
			}
			return duplicates;
		}
	};
	return Collections;
});