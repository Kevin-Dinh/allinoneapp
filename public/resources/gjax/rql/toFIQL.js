/**
 * @author	 		arakovsky
 */
define([
	"rql/query",
	"dojo/_base/array"
], function(rqlQuery, array) {

	//
	function toFIQL(/*query.Query*/query) {
		// summary:
		//		Converts given query into string using mix of FIQL and full RQL syntax
		// description:
		//		Custom toFIQL implementation, original one (in rqlQuery) dos not have fallback for operators that do not have FIQL alternative.
		//		Operators that have alternative in FIQL syntax will be stringified using this syntax, other will have fallback to full RQL syntax,
		// query: String
		//		Query to stringify

		return query.name === "and" ? array.map(query.args, function(item) {
			return qTs(item, 0);
		}).join("&") : qTs(query);
	}

	/************ conversion rql to FIQL  ************/
	var replaceOperatorMap = {
		"eq" : "=",
//		"gt" : ">",
//		"lt" : "<",
//		"ge" : ">=",
//		"le" : "<=",
//		"ne" : "!=",
		"and" : "&",
		"or" : '|'
	};

	function qTs(part, round) {
		if (part instanceof Array) {
			return '(' + array.map(part, function(arg) {
				return qTs(arg);
			}).join(",") + ')';
		}

		if (part && part.name && part.args) {

			if ((part.name == 'or' || part.name == 'and') && round > 0 && part.args.length > 1 && (part.args[0] instanceof rqlQuery.Query)) {
				return [
					"(",
					array.map(part.args, function(arg) {
						return qTs(arg, round++);
					}, round++).join(replaceOperatorMap[part.name]),
					")"
				].join("");
			} else {
				var replaceOperator = replaceOperatorMap[part.name];
				if (replaceOperator) {
					return [
						array.map(part.args, function(arg/*, pos*/) {
							return qTs(arg, round++);
						}, round++).join(replaceOperatorMap[part.name])
					].join("");
				} else {
					return [
						part.name,
						"(",
						array.map(part.args, function(arg/*, pos*/) {
							return qTs(arg);
						}).join(","),
						")"
					].join("");
				}
			}
		}

		return rqlQuery.encodeValue(part);
	}

	toFIQL.replaceOperatorMap = replaceOperatorMap;

	return toFIQL;

});