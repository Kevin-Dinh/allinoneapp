/**
 * created 01/16/2013
 * 
 * @author lzboron
 * 
 * @description test of transforming date in MVC (when it is changed from ISO str to date, and back)
 * 
 * @generated by TemplateWizard, v.2012/11/21 //do not remove this comment please
 * @see http://livedocs.dojotoolkit.org/util/doh
 */
define([
	"doh",
	"require",
	"gjax/uri/Uri",
	"gjax/mvc/StoreRefController",
	"gjax/store/SchemaStore",
	"dijit/registry",
	"gjax/request/jsonXhr",
	"gjax/testing/request/testRequest",
	"dojox/mvc/at",
	"dojo/_base/lang",
	"dojo/_base/config",
	"dojo/ready",
	"dijit/form/Form",
	"dojox/form/DateTextBox",
	"dojo/parser"
], function(doh, require, Uri, StoreRefController, SchemaStore, registry, jsonXhr, testRequest, at, lang, config, ready) {

	function testTimezone() {
		var store = new SchemaStore({
			smd : "/_timezone/partner.smd.json", //svc ctx will be set to path to this folder
			request : testRequest,
			schemaRequest : jsonXhr

		});
		var controller = new StoreRefController({
			store : store
		});

		return controller.getStore(853794679)//
		.then(function(partner) {
			doh.is("string", typeof partner.dateOfBirth, "value is loaded as iso string");

			controller.bind(registry.byId("form"));
			doh.is("string", typeof controller.get("dateOfBirth"), "value is not changed when bound to date text box, still iso string");

			registry.byId("dateTextBox").set("displayedValue", "22.05.2013");
			doh.is("object", typeof controller.get("dateOfBirth"), "editing value in date textbox changes it to Date object");

			var modelValue = controller.get("dateOfBirth");
			doh.is(2013, modelValue.getFullYear(), "formated value from input is correctly parsed: year matches");
			doh.is(4, modelValue.getMonth(), "formated value from input is correctly parsed: month matches");
			doh.is(22, modelValue.getDate(), "formated value from input is correctly parsed: day matches");
		});
	}

	ready(99, function() { //before parser
		window.at = at;
		var CTX_PREFIX = Uri.getPath(Uri.resolve(null, require.toUrl("."))); //set path to this test's folder as ctx prefix, so paths to (and in) smd may be root relative to this folder
		lang.mixin(config, {
			svcCtxPrefix : CTX_PREFIX
		});
	});

	ready(function() {
		doh.register("timezone", testTimezone);
		doh.run();
	});

});