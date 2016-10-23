define([], function() {

	// summary:
	//		Comparator functions.
	// description:
	//		Useful with array sort.
	// example:
	//		|	[8,4,5,2,8].sort(compare.simple);
	//		|	[{i:1,p:0},{i:0,p:1}].sort(compare.byProperty("i"));

	var compare = {
		simple : function(a, b) {
			// summary:
			//		Simple comparator.
			return (a < b ? -1 : (a > b ? 1 : 0));
		},
		falsyAware : function(a, b) {
			//TODO: refactor and finish see also dojo/data/util/sorter.js
			//TODO: testcase
			//TODO: api could be byProperty() and byProperty("url"), and byProperty("url").falsyAware(), numbers(), or numbers().falsyAware();
			//console.debug("falsyAware", a, b);
			if (a === b) {
				return 0;
			}
			if (typeof a == "number" && typeof b == "number" && isNaN(a) && isNaN(b)) {
				return 0;
			}
			// FIXME: In JavaScript 1.2, this method no longer converts undefined elements to null; 
			// instead it sorts them to the high end of the array. (see MDC)
			// in real, undefined is never passed to the sort function !!! (MSIE 9, Chrome)
			// test with MSIE 7 and maybe sort all at the end
			if (a === undefined) {// and b is anything else
				return 1; // undefined is less then anything 
			}
			if (b === undefined) {
				return -1;
			}
			if (a === null) {
				return 1;
			}
			if (b === null) {
				return -1;
			}
			if (/*isNaN(a)*/a !== a) { // because of a can be string
				return 1;
			}
			if (/*isNaN(b)*/b !== b) {
				return -1;
			}
			// asrt, no nulls, no undefined here
			//TODO: cover also Date.valueOf() // msie bugs here
			return compare.simple(a, b);
		},
		byProperty : function(propName) {
			// summary:
			//		Compare objects by property. For comparing "border values" see falsyAware
			return function(o1, o2) {
				return compare.falsyAware(o1[propName], o2[propName]);
			};
		},
		byProperties : function(propNames) {
			// summary:
			//		Compare objects by serevral properties. For comparing "border values" see falsyAware
			return function(o1, o2) {
				var i, l = propNames.length, r = 0;
				for (i = 0; !r && i < l; i++) {
					r = compare.falsyAware(o1[propNames[i]], o2[propNames[i]]);
				}
				return r;
			};
		}
	};
	return compare;
});