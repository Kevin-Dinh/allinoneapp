define([
	"rql/js-array-compat",
	"dojo/_base/array",
	"gjax/rql/template",
	//
	"gjax/rql/operators" // to fix sort operator
], function(rql, array, template) {

	//NTH: unit-test

	function getSortArguments(sortDetails) {
		//sort(+price,-rating)
		return array.map(sortDetails, function(s) {
			return (s.descending ? "-" : "+") + s.attribute;
		});
	}

	return function(query, options, target) {
		// summary:
		//		This module define RQL query engine for store.
		// description:
		//		You can pass query as RQL string or object with RQL template defined.
		//		Rql template should be defined in query or options property.

		return function(data) {
			// rql query should be string, so try feed entered rql template with query object
			var queryString;
			if (query && typeof query === "object") {
				var rqlTmpl = (query || {})._template || (options || {})._template;
				if (rqlTmpl) {
					queryString = template.feed(rqlTmpl, query, options);
				}
			}
			var results = rql.query(typeof queryString == "string" ? queryString : query, options, target)(data.slice());
			//Added support for paging and sorting when using rql queryengine in grid
			if (options) {
				if (options.sort) {
					var sort = options.sort;
					// parse sort args only if entered as array
					results = rql.operators.sort.apply(results, sort instanceof Array ? getSortArguments(sort) : sort.split(","));
				}
				if (!isNaN(options.count) && !isNaN(options.start)) {
					results = rql.operators.limit.call(results, options.count, options.start, true); //true == set totalCount to infinity
					results.total = results.totalCount;
				}
			}
			return results;
		};
	};
});
