/**
 * created 04/08/2014
 * 
 * @author marcus
 * 
 * @description TODO: fill in description
 * 
 * @generated by TemplateWizard, v.2012/11/21 //do not remove this comment please
 * @see http://livedocs.dojotoolkit.org/util/doh
 */
define([
	"dojo/ready",
	"doh",
	//tested libraries
	"dojo/has",
	"gjax/dom/attributes"

], function(ready, doh, has, attributes) {

	var testObject = {

		"attributes" : function() {
			console.log(has("dom-attributes-explicit"));
			console.log(has("dom-attributes-specified-flag"));

			var attrs = attributes(document.getElementById("f1"));

			doh.t(attrs instanceof Array, "NamedNodeMap never returned");

			//doh.is(2 + 1, attrs.length, "id, name + added method (default)");
			//after move to gjax, method atttribute is not automaticaly generated by taglib
			
			doh.is(2, attrs.length, "id, name");

		}
	};

	// --------------------------------------
	doh.register("dom", testObject);

	ready(function() {
		doh.run();
	});
});