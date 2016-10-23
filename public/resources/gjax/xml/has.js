define([
	"require",
	"dojo/sniff",
	"./Xml",
	"dojo/request/xhr" //loading this module ensures we have defined: native-msxml-document, dom-parser
], function(require, has, Xml) {

	var _doc;
	function doc() {
		if (!_doc) {
			_doc = Xml.loadXml("<sample xmlns:x='foo' x:attr='x_attr_value'><ch1/></sample>");
		}
		return _doc;
	}

	if (has("host-browser")) {

		var trident = has("trident") || 0; // || 0 for better conditions

		has.add("xslt-processor", typeof window.XSLTProcessor != "undefined");

		//override value defined in dojo/request/handlers
		// IE9+ (Trident 5+) has DOMParser, but buggy (no evaluate method...)
		has.add("dom-parser", trident >= 5 ? false : typeof DOMParser != "undefined", true, true);

		has.add("xml-import-node", function() {
			return "importNode" in doc();
		});

		has.add("xml-first-element-child", function() {
			// doble check of Traversal features ! FF lies ?
			return doc().documentElement.firstElementChild !== undefined;
		});

		has.add("xml-append-child-xd", function() {
			var o = Xml.loadXml("<d1><ch1/></d1>").documentElement.firstChild;
			var n = Xml.loadXml("<d2><ch2/></d2>").documentElement.firstChild;
			try {
				o.appendChild(n);
				return true;
			} catch (ex) {
				return false;
			}
		});

	}

	return has;
});