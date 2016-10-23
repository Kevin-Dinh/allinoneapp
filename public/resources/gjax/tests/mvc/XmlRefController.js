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
	"require",
	"dojo/ready",
	"doh",
	"gjax/xml/X",
	"dojo/dom",
	"dijit/registry",
	"gjax/mvc/at",
	"gjax/mvc/converters",
	"./lib/XmlRefController",
	"dojo/date/stamp", //SCREEN WIDGETS
	"gjax/_base/date",
	"dijit/form/Form",
	"dijit/form/ValidationTextBox",
	"dojox/mvc/Group",
	"dojo/parser",
	"dojox/form/DateTextBox",
	//to enable scoped converters:
	"gjax/extensions/mvc"
], function(require, ready, doh, X, dom, registry, at, converters, XmlRefController, stamp, gdate) {

	var testObject = {
		"Load model checks input" : function() {
			var cntr = new XmlRefController();
			cntr.loadModelFromData(X.load(require.toUrl("./data/binding.xml")));

			try {
//				cntr.loadModelFromData({});
//				doh.t(false, "Unexpected succes");
			} catch (e) {
			}
		},

		"Get & set works correctly" : function() {
			var cntr = new XmlRefController();
			var xmlDoc = X.load(require.toUrl("./data/binding.xml"));
			cntr.loadModelFromData(xmlDoc);

			doh.is("456", cntr.get("a/c"));
			doh.is("123", cntr.get("a/b/@value"));

			doh.is("", cntr.get("a/d"));
			cntr.set("a/d", "foo");
			doh.is("foo", cntr.get("a/d"));

			doh.is("", cntr.get("a/d/@value"));
			cntr.set("a/d/@value", "foo");
			doh.is("foo", cntr.get("a/d/@value"));

			doh.t(~xmlDoc.getXml().indexOf("<d value=\"foo\">foo</d>"), "Unexpected xml: " + xmlDoc.getXml());
		},

		"Watch callbacks on model data loading  " : function() {
			//not implemented feature (probably not possible to implement)
			var cntr = new XmlRefController();

			var callbackCalled;
			cntr.watch("a/c", function(prop, oldVal, newVal, isLoad) {
				doh.is("a/c", prop);
				doh.is(undefined, oldVal);
				doh.is("456", newVal);
				doh.t(isLoad, "isLoad expected");
				callbackCalled = true;
			});

			var xmlDoc = X.load(require.toUrl("./data/binding.xml"));
			cntr.loadModelFromData(xmlDoc);

			doh.t(callbackCalled, "callback was not called");
		},

		"Watch callbacks ARE CALLED on model data loading  " : function() {
			//not implemented feature (probably not possible to implement)
			var cntr = new XmlRefController();

			var xmlDoc = X.load(require.toUrl("./data/binding.xml"));
			cntr.loadModelFromData(xmlDoc);

			var callbackCalled;
			cntr.watch("a/c", function(prop, oldVal, newVal, isLoad) {
				doh.is("a/c", prop);
				doh.is("456", oldVal);
				doh.is("foo", newVal);
				doh.f(isLoad, "isLoad not expected");
				callbackCalled = true;
			});

			cntr.set("a/c", "foo");
			doh.t(callbackCalled, "callback was not called");
		},

		"'at binding' to widget" : function() {
			var form = registry.byId("f1");
			var cntr = new XmlRefController();
			cntr.bind(form);

			cntr.loadModelFromData(X.load(require.toUrl("./data/binding.xml")));

			doh.is("456", registry.byId("tb1").get("value"));
		},

		"'at binding' from widget" : function() {
			var form = registry.byId("f1");
			var cntr = new XmlRefController();
			cntr.bind(form);

			var xmlDoc = X.load(require.toUrl("./data/binding.xml"));
			cntr.loadModelFromData(xmlDoc);

			doh.is("", cntr.get("a/c2"));
			registry.byId("tb2").set("value", "foo");

			doh.is("foo", cntr.get("a/c2"));
			doh.t(~xmlDoc.getXml().indexOf("<c2>foo</c2>"), "Unexpected xml: " + xmlDoc.getXml());
		},

		"'at binding' both directions" : function() {
			var form = registry.byId("f1");
			var cntr = new XmlRefController();
			cntr.bind(form);

			var xmlDoc = X.load(require.toUrl("./data/binding.xml"));
			cntr.loadModelFromData(xmlDoc);

			doh.is("789", registry.byId("tb3").get("value"));
			doh.is("789", registry.byId("tb4").get("value"));
			registry.byId("tb3").set("value", "foo");

			doh.is("foo", registry.byId("tb3").get("value"));
			doh.is("foo", registry.byId("tb4").get("value"));
		},
		"nested 'at' binding" : function() {
			var form = registry.byId("f1");
			var cntr = new XmlRefController();
			cntr.bind(form);

			var xmlDoc = X.load(require.toUrl("./data/binding.xml"));
			cntr.loadModelFromData(xmlDoc);

			doh.is("123", registry.byId("tb5").get("value"));
			doh.is("123", registry.byId("tb7").get("value"));

			doh.is("", cntr.get("/a/nested/y"));
			doh.is("", registry.byId("tb8").get("value"));

			registry.byId("tb6").set("value", "bar");
			doh.is("bar", cntr.get("/a/nested/y"));
			//AR: this is not working, different nesting, resulting in same xpath will not be synced (watch does not work)
			//doh.is("bar", registry.byId("tb8").get("value"));
			doh.t(~xmlDoc.getXml().indexOf("<y>bar</y>"), "Unexpected xml: " + xmlDoc.getXml());

			registry.byId("tb8").set("value", "baz");
			doh.is("baz", cntr.get("/a/nested/y"));
			doh.t(~xmlDoc.getXml().indexOf("<y>baz</y>"), "Unexpected xml: " + xmlDoc.getXml());
		},
		"Transform works correctly" : function() {
			var form = registry.byId("f1");
			var cntr = new XmlRefController();
			cntr.bind(form);

			var xmlDoc = X.load(require.toUrl("./data/binding.xml"));
			cntr.loadModelFromData(xmlDoc);

			var dtb = registry.byId("dtb");

			var value = dtb.get("value");
			doh.t(gdate.equals(new Date(2001, 9, 26), value, "date"), "Unexpected date:" + value);

			dtb.set("value", new Date(2016, 1, 29));
			doh.is("2016-02-29", cntr.get("a/date"), "Unexpected value in model");
			doh.t(~xmlDoc.getXml().indexOf("<date>2016-02-29</date>"), "Unexpected xml: " + xmlDoc.getXml());
		}

	};

	// --------------------------------------
	doh.register("registry", testObject);

	ready(99, function() {
		window.at = at;
		converters.xsdDate = {
			// just sample implementation of converter
			format : function(value) {
				return value && stamp.fromISOString(value);
			},
			parse : function(value) {
				return value && stamp.toISOString(value, {
					selector : "date"
				});
			}
		};
	});

	ready(function() {
		doh.run();
	});
});
