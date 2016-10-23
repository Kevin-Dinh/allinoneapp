/**
 * created 03/07/2014
 * 
 * @author marcus
 * 
 * @description POC and design of newer methods in gjax.registry 
 * 
 * This is mostly designed to help understand runtime status of widgets in screen 
 * and for writing selenium-driver JS tests
 * 
 */
define([
	"dojo/ready",
	"doh",
	//tested libraries
	"gjax/registry",
	"gjax/registry/debug",
	"gjax/json/cycle",
	// helper libraries
	"dojo/json",
	"gjax/collections/indexOf",
	"gjax/_base/object",
	"dojo/_base/lang",
	"dojo/parser",
	"dijit/form/Button"
], function(ready, doh, registry, rdebug, cjson, json, indexOf, gobject, lang) {

	var testObject = {
		setUp : function() {
			// create cycle between two widgets
			var b1 = registry.byId("b1");
			var b2 = registry.byId("b2");
			b1.x = b2;
			b2.x = b1;
		},
		"(old) dumpWidgets is very limited with output" : function() {
			rdebug.dumpWidgets(registry.toArray());
		},
		"json stringify will fail on cyclic structure" : function() {
			try {
				json.stringify(registry.toArray());
				doh.f(false);
			} catch (ex) { //TODO: more exact match on exception
				doh.t(true);
			}
		},
		"lets solve json cyclic refs with gjax.json.decycle" : function() {
			var widgets = registry.toArray();
			var serializableWidgets = cjson.decycle(widgets, serializeNode); //must use serializer for dom nodes otherwise fails in chrome (and maybe others)
			var widgetsJson = json.stringify(serializableWidgets, null, "  ");
			console.log("widgetsJson:", widgetsJson);
		},
		"POC for working widget2json serialize inherited props)" : function() {
			var b1 = registry.byId("b1");
			console.log("norm:", widget2json(b1, false, null, "  "));
			console.log("deep:", widget2json(b1, true, null, "  "));
			console.log("publ:", widget2json(b1, true, publicOnly, "  "));
		}

	};
	function widget2json(w, deep, replacer, spacer) {
		//signature of stringify with extra 2nd param
		return json.stringify(cjson.decycle(deep ? lang.mixin({}, w) : w, serializeNode), replacer, spacer);
	}
	function publicOnly(widgetPropName, value) {
		if (widgetPropName.indexOf("_") !== 0) {
			return value;
		}
	}
	function isNode(o) {
		// http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
		return (typeof Node === "object" ? o instanceof Node : o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string");
	}

	function serializeNode(node) {
		//https://raw.github.com/Eccenux/JSON-js/master/cycle.js
		if (isNode(node)) {
			var text = "";

			if (node.nodeType === node.ELEMENT_NODE) {
				text = node.nodeName.toLowerCase();
				if (node.id.length) {
					text += '#' + node.id;
				} else {
					if (node.className.length) {
						text += '.' + node.className.replace(/ /, '.');
					}
				}
			}
			// info on values: http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-1841493061
			else {
				text = node.nodeName;
				if (node.nodeValue !== null) {
					text += '{value:' + (node.nodeValue.length < 20 ? node.nodeValue : node.nodeValue.substr(0, 20) + '...') + '}';
				}
			}
			return text;
		}
	}

	// --------------------------------------
	doh.register("registry", testObject);

	ready(function() {
		doh.run();
	});
});