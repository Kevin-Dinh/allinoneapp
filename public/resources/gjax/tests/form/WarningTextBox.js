/**
 * created 03/26/2013
 * 
 * @author lzboron
 * 
 * @description unit test for module "gjax/form/_WarningMixin"
 * 
 * @generated by TemplateWizard, v.2012/11/21 //do not remove this comment please
 * @see http://livedocs.dojotoolkit.org/util/doh
 */
define([
	"dojo/ready",
	"doh",
	"dijit/registry",
	"dijit/form/ValidationTextBox",
	//tested libraries
	"gjax/form/_WarningMixin",
	"dojo/parser"
], function(ready, doh, registry) {

	var textBox;
	var testObject = {
		validate : function() {
			textBox.set("value", "1234");
			doh.assertTrue(textBox.validate());
			doh.assertTrue(textBox.isValid());
			doh.assertFalse(textBox.isExpected());
			textBox.set("value", "123");
			doh.assertTrue(textBox.validate());
			doh.assertTrue(textBox.isValid());
			doh.assertTrue(textBox.isExpected());
			textBox.set("value", "123456");
			doh.assertFalse(textBox.validate());
			doh.assertFalse(textBox.isValid());
			doh.assertFalse(textBox.isExpected());
			textBox.set("value", "");
			doh.assertTrue(textBox.validate());
			doh.assertTrue(textBox.isValid());
			doh.assertFalse(textBox.isExpected());
			textBox.set("value", null);
			doh.assertTrue(textBox.validate());
			doh.assertTrue(textBox.isValid());
			doh.assertFalse(textBox.isExpected());
		},
		warningMessage : function() {
			textBox.set("value", "1234");
			textBox.validate();
			doh.assertEqual(textBox.message, "Warning!!!");
		}
	};

	// --------------------------------------
	doh.register("WarningTextBox", testObject);

	ready(function() {
		textBox = registry.byId("textBox");
		doh.run();
	});
});