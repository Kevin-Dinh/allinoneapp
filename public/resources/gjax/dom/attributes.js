define([
	"dojo/has",
	"dojo/_base/array"
], function(has, array) {

	return function(node) {
		// seems like missing XB function to get list of all atributes
		// taken from parser.js, excluding IE6-7
		// GIGO, call only over Elements
		// init test in /views/unit-test/gjax/dom/
		// return: always [] not [object NamedNodeMap], http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-1780488922
		// order is unknown
		var attributes;
		if (has("dom-attributes-explicit")) {
			// Standard path to get list of user specified attributes
			attributes = array.map(node.attributes,function(a){
				return a;
			});
		} else if (has("dom-attributes-specified-flag")) {
			// Special processing needed for IE8, to skip a few faux values in attributes[]
			attributes = array.filter(node.attributes, function(a) {
				return a.specified;
			});
		} else {
			// Special path for IE6-7, avoid (sometimes >100) bogus entries in node.attributes
			throw Error("IE 6-7 not supported by gjax/attributes module");
		}
		return attributes;
	};
});