define([], function() {
	var sparse = [];
	sparse[3] = 1;
	sparse[4] = undefined;
	sparse[5] = "a";
	var testData = {
	     "normal" : [
         //	 [arr, el, fromIndex], out // fromIndex is optional
	         [[], "a"], -1,
		     [["a", "b", "c", "a", "b"], "a"], 0,
		     [["a", "b", "c", "a", "b"], "b"], 1,
		     [["a", "b", "c", "a", "b"], "d"], -1,
		     [["a", "b", "c", "a", "b"], "a", 0], 0,
		     [["a", "b", "c", "a", "b"], "a", 1], 3,
		     [["a", "b", "c", "a", "b"], "a", 3], 3,
		     [["a", "b", "c", "a", "b"], "a", 4], -1,
		     [["a", "b", "c", "a", "b"], "a", 40], -1,
		     [sparse, "a"], 5,
		     [sparse, "a", 5], 5
	     ],
	     "numbers" : [
	     	 [[0, 1, 2, 3, 2, 1, 0], 2], 2,
	     	 [[3, 2, 1, 0, 1, 2, 3], 2], 1,
	     	 [[0, 1, 2, 3, 2, 1, 0], 2, 3], 4,
	     	 [[3, 2, 1, 0, 1, 2, 3], 2, 3], 5
	     ],
	     "multiple occurence" : [
	         [["a", "b", "b", "c"], "b"], 1,            
	         [["a", "b", "b", "c"], "b", 2], 2,            
	         [[1, 0, 0, 0], 0], 1,
	         [[1, 0, 0, 0], 0, 2], 2      
	     ],
	     "zero, null, false" : [
             [[false, 0, undefined, null, ""], 0], 1,
             [[0, false, undefined, null, ""], false], 1,
		     [[false, 0, undefined, null, ""], ""], 4,
		     [[false, 0, undefined, null, ""], null], 3,
		     [[false, 0, null, undefined, ""], null], 2,
		     [sparse, null], -1
	     ],
	     "undefined" : [
	         [[], undefined], -1,
	         [[false, 0, null, undefined, ""], undefined], 3,
	         [[false, 0, undefined, null, ""], undefined], 2
         ],
         "sparse-undefined" : [
            [sparse, undefined], 4,
            [Array(3), undefined], -1
         ],
		 "Infinity" : [
	         [[0, 1, Infinity, -Infinity, 2], 2], 4,
	         [[0, 1, Infinity, -Infinity, 2], Infinity], 2,
	         [[0, 1, Infinity, -Infinity, 2], -Infinity], 3
	     ],
	     "Nonstandard fromIndex" : [
	         [["a", "b", "c", "a", "b"], "a", "b"], 0,
	         [["a", "b", "c", "a", "b"], "a", Infinity], -1,
	         [["a", "b", "c", "a", "b"], "b", Infinity], -1,
	         [["a", "b", "c", "a", "b"], "a", -Infinity], 0,
	         [["a", "b", "c", "a", "b"], "a", NaN], 0,
	         [["a", "b", "c", "a", "b"], "a", ["a", "b"]], 0,
	         [["a", "b", "c", "a", "b"], "a", {g : 1}], 0
         ]
	// TODO more tests - objects, 
	};
	return testData;
});