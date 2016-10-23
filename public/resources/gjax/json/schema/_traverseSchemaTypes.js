define([
	"dojo/_base/array",
	"dojo/_base/lang"
], function(darray, lang) {

	function isObject(s) {
		return isType(s, "object");
	}
	function isArray(s) {
		return isType(s, "array");
	}
	function isUnion(s) {
		return s.type instanceof Array;
	}
	function isType(schema, type) {
		/*jshint laxbreak:true*/
		// checks if s (schema object) conforms to {type:"object"}, or {type:["object",....]} or {type:[{type:"object"},....]
		// "object" used as an example
		return schema.type === type || // {type:"object"}
		schema.type instanceof Array && darray.some(schema.type, _isType); //type:[...] //union types

		function _isType(_type) {
			return _type === type || //{type:["object",....]}
			typeof _type === "object" && _type.type === type; //{type:[{type:"object"},....]
		}
	}
	// main return 
	function traverse(s, path, visitor) {
		/*jshint expr:true */
		path || (path = "");
		var p;
		if (isObject(s)) {
			for (p in s.properties) {
				traverse(s.properties[p], path + "/" + p, visitor);
			}
		} else if (isArray(s)) {
			traverse(s.items, path, visitor);
		} else if (lang.isArray(s)) {
			for (var i = 0; i < s.length; i++) {
				traverse(s[i], path, visitor);
			}
		} 
		if (s.type) {
			var type = s.type;
			if (type instanceof Array) {
				for (var j = 0; j < type.length; j++) {
					traverse(type[j], path, visitor);
				}
			} else {
				traverse(type, path, visitor);
			}
		}
		
		var r = visitor.call(null, s, path, visitor);
		return r;
	}
	// needed by ithers as well
	traverse.isUnion = isUnion;
	traverse.isObject = isObject;
	traverse.isArray = isArray;

	return traverse;

});