define([], function() {

	// sorting/paginating copy-pasted from dojo/store/util/SimpleQueryEngine
	function sort(results, options) {
		var sortSet = options && options.sort;
		if (sortSet) {
			results.sort(typeof sortSet == "function" ? sortSet : function(a, b) {
				for ( var sort, i = 0; (sort = sortSet[i]); i++) {
					var aValue = a[sort.attribute];
					var bValue = b[sort.attribute];
					if (aValue != bValue) {
						var descending = !!sort.descending;
						return descending == (aValue == null || aValue > bValue) ? -1 : 1;
					}
				}
				return 0;
			});
		}
		return results;
	}

	function limit(results, options) {
		if (options && (options.start || options.count)) {
			var total = results.length;
			results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
			results.total = total;
		}
		return results;
	}

	return function(operators/*Object*/) {
		// summary:
		//		This module define custom user defined query engine for store.
		//		Query engine is defined by object of query functions.
		// operators: Object
		//		Object of query functions to be used by query engine from store.

		// Note: query functions should not modify original data passed into query
		//		 but returns always fresh copy.

		return function(query, options/*Object?*/) {
			return function(data) {
				var fn = typeof query == "function" ? query : operators[query];
				// Scope of function will be operators object (operators methods can be reused)
				var results = typeof fn == "function" ? fn.call(operators, data, options) : data; // TODO log warning
				results = sort(results, options); // next we sort
				results = limit(results, options); // now we paginate
				return results;
			};
		};
	};
});