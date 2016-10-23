/**
 * created 07/22/2013
 * 
 * @author arakovsky
 * 
 * @description test for resolved enums feature (implemenetd in "gjax/mvc/ModelRefController" and EnhancedStateful)
 * 
 * @generated by TemplateWizard, v.2012/11/21 //do not remove this comment please
 * @see http://livedocs.dojotoolkit.org/util/doh
 */
define([
	"require",
	"gjax/extensions/mvc", //MUST BE LOADED FIRST
	"gjax/extensions/_SearchMixin",
	"gjax/extensions/filteringSelect",
	"dojo/ready",
	"dojo/_base/config",
	"gjax/mvc/ModelRefController",
	"doh",
	"gjax/store/LazyMemory",
	"gjax/uri/Uri",
	"gjax/request/jsonXhr",
	"dijit/registry",
	"dojo/Deferred",
	"dojo/_base/lang",
	"dojo/store/Memory",
	"gjax/mvc/at",
	"dijit/form/Form",
	"dijit/form/FilteringSelect",
	"dojox/mvc/Group",
	"dojo/parser"
], function(require, mvc, _SearchMixin, filteringSelect, ready, config, ModelRefController, doh, LazyMemory, Uri,//
request, registry, Deferred, lang, Memory, at) {

	var model = window.model = new ModelRefController();
	// config.resolvedEnumSuffix  - no config in test, using default "Label"

	var testObject = {
		"Test set of resolved item" : function() {
			var modelController = new ModelRefController();
			modelController.loadModelFromData({});

			modelController.set("_roleItem", '{"id":123,"name":"Male"}');
			doh.is(123, modelController.model.role, "Unexpected role: " + modelController.model.role);
			doh.is("Male", modelController.model.roleLabel, "Unexpected label: " + modelController.model.roleLabel);
		},
		"Test set of custom resolved item" : function() {
			var modelController = new ModelRefController();
			modelController.loadModelFromData({});

			modelController.set("_roleItem", '{"id":123,"name":"Male","resolvedProp":"roleName"}');
			doh.is(123, modelController.model.role, "Unexpected role: " + modelController.model.role);
			doh.is("Male", modelController.model.roleName, "Unexpected label: " + modelController.model.roleName);
		},
		"Test set of property with existing resolved item" : function() {
			var modelController = new ModelRefController();
			modelController.loadModelFromData({
				_roleItem : '{"id":123,"name":"Male"}'
			});

			modelController.set("role", 456);
			doh.is(456, modelController.model.role, "Unexpected role: " + modelController.model.role);
			doh.is(null, modelController.model.roleLabel, "Unexpected label: " + modelController.model.roleLabel);
			doh.is('{"id":456}', modelController.model._roleItem, "Unexpected role: " + modelController.model.role);
		},
		"Test resolved enum in FS" : function() {
			model.loadModelFromData({
				sub : {
					gender1 : 123,
					gender1Label : "Foo"
				}
			});
			doh.is("Foo", registry.byId("fs1").displayedValue, "Unexpected displayedValue");
		},
		"Test flag in FS resolved item" : function() {
			model.loadModelFromData({
				sub : {
					gender1 : 123,
					gender1Label : "Foo"
				} 
			});
			doh.t(registry.byId("fs1").get("item").isResolvedItem, ".isResolvedItem should be true");
		},
		"Test unresolved enum from model in FS" : function() {
			var testResult = new Deferred();
			var fs2 = registry.byId("fs2");
			var h = fs2.watch("displayedValue", function(prop, oldVal, val) {
				h.remove();
				if (val == "Female") {
					testResult.resolve();
				} else {
					testResult.reject("Unexpected displayedValue: " + val);
				}
			});
			model.loadModelFromData({
				sub : {
					gender2 : 123
				}
			});

			return testResult;
		},
		"Test unresolved enum by updating model" : function() {
			var testResult = new Deferred();
			var fs3 = registry.byId("fs3");
			var h = fs3.watch("displayedValue", function(prop, oldVal, val) {
				h.remove();
				if (val == "Unknown") {
					testResult.resolve();
				} else {
					testResult.reject("Unexpected displayedValue: " + val);
				}
			});
			model.model.sub.set("gender3", 456);

			return testResult;
		},
		"Test unresolved enum by set data to model when store data was already fetched" : function() {
			// test of bugfix
			var testResult = new Deferred();

			model.loadModelFromData({
				sub : {
					gender3 : 456
				}
			});

			var h = model.model.sub.watch("gender3Label", function(prop, oldVal, val) {
				h.remove();
				if (val === "Female") {
					testResult.resolve();
				} else {
					testResult.reject("Unexpected label value in model: " + val);
				}
			});

			model.model.sub.set("gender3", 123);
			return testResult;
		},
		"Test setting wrong ID will not cause endless loop" : function() {
			// test of bugfix
			model.loadModelFromData({
				sub : {
					gender4 : 123,
					gender4Label : "Female"
				}
			});

			// caused infinite loop
			model.model.sub.set("gender4", 999);

			doh.is(null, model.model.sub.gender4);
			doh.is(null, model.model.sub.gender4Label);
			// FS should keep original displayed value but will be marked as invalid
			doh.is("Female", registry.byId("fs4").get("displayedValue"));
			doh.is("Error", registry.byId("fs4").get("state"));
		},
		"Test custom resolved property name - from model to widget" : function() {
			model.loadModelFromData({
				sub : {
					gender5 : 123,
					customProp5 : "Female"
				}
			});
			doh.is(registry.byId("fs5").displayedValue, "Female", "Unexpected displayedValue");
		},
		"Test custom resolved property name - from widget to model" : function() {
			model.loadModelFromData({});
			var fs = registry.byId("fs6");
			var store = new Memory();
			fs.set({
				store : store, //we must have store, code in mvc relies on its idProperty
				item : {
					id : 1,
					name : "foo"
				}
			});
			var modelData = model.getPlainValue();
			doh.is(1, modelData.sub.gender6, "Unexpected model data");
			doh.is("foo", modelData.sub.customProp6, "Unexpected model data");
		},
		"Test setting empty" : function() {
			model.loadModelFromData({
				sub : {
					gender7 : 123,
					customProp7 : "Female"
				}
			});

			var fs = registry.byId("fs7");
			doh.is(123, model.model.sub.gender7);
			doh.is("Female", model.model.sub.customProp7);
			doh.is(123, fs.get("value"));
			doh.is("Female", fs.get("displayedValue"));

			// reseting widget value itself
			fs.set("value", null);
			doh.is(null, model.model.sub.gender7);
			doh.is(null, model.model.sub.customProp7);
			doh.is("", fs.get("value")); // should be null?
			doh.is("", fs.get("displayedValue")); // should be null?
			doh.is(null, fs.get("item"));

			model.loadModelFromData({
				sub : {
					gender7 : 123,
					customProp7 : "Female"
				}
			});

			// reseting widget value by model
			model.model.sub.set("gender7", null);
			doh.is(null, model.model.sub.gender7);
			doh.is(null, model.model.sub.customProp7);
			doh.is("", fs.get("value")); // should be null?
			doh.is("", fs.get("displayedValue")); // should be null?
			doh.is(null, fs.get("item"));
		}
	};

	// --------------------------------------
	doh.register("resolved-enums", testObject);

	ready(99, function() {
		window.at = at;
	});

	ready(function() {

		var store = new LazyMemory({
			dataFunction : function() {
				return request.get(Uri.resolve(null, require.toUrl("./data/_mock.json")));
			}
		});
		var syncStore = new Memory({
			data : [
				{
					"id" : 123,
					"name" : "Female"
				},
				{
					"id" : 456,
					"name" : "Unknown"
				}
			],
			idProperty : "id"
		});

		registry.byId("fs1").set("store", store);
		registry.byId("fs2").set("store", store);
		registry.byId("fs3").set("store", store);
		registry.byId("fs4").set("store", syncStore);
		model.bind(registry.byId("form"));

		doh.run();
	});
});