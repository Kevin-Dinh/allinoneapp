/**
 * created 07/23/2013
 * 
 * @authorjukrop
 * @see http://livedocs.dojotoolkit.org/util/doh
 * @description unit test for module "gjax/mvc/ModelRefController"
 * 
 * @generated by TemplateWizard, v.2013/01/03 //do not remove this comment please
 */
define([
	"doh",
	"gjax/request/util",
	"dojo/Deferred",
	"dojo/request/registry",
	"dojo/store/Memory",
	"dojo/when",
	"gjax/mvc/EnhancedStateful",
	//tested
	"gjax/mvc/ModelRefController",
	"dojox/lang/functional"
], function(doh, util, Deferred, request, Memory, when, EnhancedStateful, ModelRefController, df) {

	function emptyObj(o) {
		var i;
		for (i in o) {
			return false;
		}
		return true;
	}

	function getChangedAndTest(c, shouldBeEmpty) {
		var v = c.getChangedValue();
		doh.is(shouldBeEmpty, emptyObj(v), "Changed values should " + (shouldBeEmpty ? "" : "not ") + "be empty.");
		return v;
	}

	var testObject = {
		"Initial state" : function() {
			var cntr = new ModelRefController();
			doh.t(cntr.model === null); // initial state of controller
		},

		"Load model from data" : function() {
			var cntr = new ModelRefController();
			// various data can be loaded to model
			_test({
				a : 1
			});
			_test([
				{
					a : 1
				},
				{
					a : 2
				}
			]);

			function _test(o) {
				cntr.loadModelFromData(o);
				var plainValue = cntr.getPlainValue();
				doh.is(o, plainValue);
				doh.f(plainValue === o); // object is cloned
				doh.f(cntr.model === o);
			}
		},

		"Get changed properties on model" : function() {
			var cntr = new ModelRefController();
			// load empty model
			cntr.loadModelFromData({});
			getChangedAndTest(cntr, true);

			// change it
			cntr.set("a", 1);
			doh.t({
				a : 1
			}, getChangedAndTest(cntr, false));
			doh.t(cntr.hasChangedProp("a"));

			// add more changes
			cntr.set("b", 2);
			doh.is({
				a : 1,
				b : 2
			}, getChangedAndTest(cntr, false));
			doh.t(cntr.hasChangedProp("b"));

			// add duplicit changes
			cntr.set("b", 55);
			doh.is({
				a : 1,
				b : 55
			}, getChangedAndTest(cntr, false));
			doh.t(cntr.hasChangedProp("b"));

			// commit
			cntr.commit();
			getChangedAndTest(cntr, true);
			doh.f(cntr.hasChangedProp("a"));
			doh.f(cntr.hasChangedProp("b"));
		},

		"Get changed properties on sub-model" : function() {
			var cntr = new ModelRefController();
			// load hierarchical model
			cntr.loadModelFromData({
				a : 1,
				b : {
					c : 2,
					d : 3,
					bb : {
						cc : 6
					}
				}
			});
			getChangedAndTest(cntr, true);

			// change nested property
			cntr.get("b").set("c", 22);
			doh.is({
				b : {
					c : 22
				}
			}, getChangedAndTest(cntr, false));

			doh.f(cntr.hasChangedProp("b"));
			doh.t(cntr.hasChangedProp("b.c"));
			doh.f(cntr.hasChangedProp("b.d"));

			// change another nested property
			cntr.get("b").set("e", 55);
			console.log(cntr._changedProps);
			doh.is({
				b : {
					c : 22,
					e : 55
				}
			}, getChangedAndTest(cntr, false));

			// change deeper nested property
			cntr.get("b").get("bb").set("cc", 66);
			doh.is({
				b : {
					c : 22,
					e : 55,
					bb : {
						cc : 66
					}
				}
			}, getChangedAndTest(cntr, false));

			doh.f(cntr.hasChangedProp("b"));
			doh.f(cntr.hasChangedProp("b.bb"));
			doh.t(cntr.hasChangedProp("b.bb.cc"));

			cntr.commit();
			getChangedAndTest(cntr, true);
		},
		"Get changed sub-model" : function() {
			var cntr = new ModelRefController();
			// load hierarchical model
			cntr.loadModelFromData({
				a : 1,
				b : {
					c : null
				}
			});
			getChangedAndTest(cntr, true);

			// set stateful to property
			cntr.get("b").set("c", new EnhancedStateful({
				x : {
					y : 3
				}
			}));
			var changed = getChangedAndTest(cntr, false);
			doh.is({
				b : {
					c : {
						x : {
							y : 3
						}
					}
				}
			}, changed);

			var modelC = cntr.get("b").get("c");
			doh.t(modelC.isInstanceOf && modelC.isInstanceOf(EnhancedStateful));
			var changedC = changed.b.c;
			doh.t(!changedC.isInstanceOf || !modelC.isInstanceOf(EnhancedStateful));

			cntr.commit();
			getChangedAndTest(cntr, true);
		},

		"Change property back" : function() {
			var cntr = new ModelRefController();
			// load model
			cntr.loadModelFromData({
				a : 1,
				b : 2,
				c : {
					d : 5
				}
			});
			getChangedAndTest(cntr, true);

			// change prop + add prop
			cntr.set({
				a : 11,
				aa : 1111
			});
			cntr.get("c").set({
				d : 55,
				e : 66
			});
			doh.is({
				a : 11,
				aa : 1111,
				c : {
					d : 55,
					e : 66
				}
			}, getChangedAndTest(cntr, false));
			doh.t(cntr.hasChangedProp("a"));
			doh.t(cntr.hasChangedProp("aa"));
			doh.t(cntr.hasChangedProp("c.d"));
			doh.t(cntr.hasChangedProp("c.e"));

			// change back!
			cntr.set("a", 1);
			cntr.get("c").set("d", 5);
			doh.is({
				aa : 1111,
				c : {
					e : 66
				}
			}, getChangedAndTest(cntr, false));

			doh.f(cntr.hasChangedProp("a"));
			doh.f(cntr.hasChangedProp("c.d"));
			doh.t(cntr.hasChangedProp("c.e"));

			// really remove added
			cntr.set("aa", undefined);
			cntr.get("c").set("e", undefined);
			getChangedAndTest(cntr, true);
			doh.f(cntr.hasChangedProp("aa"));
			doh.f(cntr.hasChangedProp("c.e"));
		},

		"Ignore property change" : function() {
			var cntr = new ModelRefController({
				ignoredProps : [
					5,
					"a", // simple
					"d" // object
				]
			// nested
			});
			// load hierarchical model
			cntr.loadModelFromData({
				a : 1,
				aa : 1,
				b : 2,
				c : 3,
				d : {
					e : 5
				},
				5 : "num"
			});
			getChangedAndTest(cntr, true);

			cntr.set("a", 11); // ignored
			cntr.set("5", 11); // ignored
			cntr.get("d").set("e", 55); // ignored
			cntr.get("d").set("f", 66); // ignored
			getChangedAndTest(cntr, true);
			doh.f(cntr.isDirty(), "Should not be dirty");

			cntr.set("aa", 22); // not ignored
			cntr.set("b", 22); // not ignored
			doh.is({
				b : 22,
				aa : 22
			}, getChangedAndTest(cntr, false));

			doh.f(cntr.hasChangedProp("a"));
			doh.t(cntr.hasChangedProp("aa"));
			doh.f(cntr.hasChangedProp("5"));
			doh.t(cntr.hasChangedProp("b"));
			doh.f(cntr.hasChangedProp("c"));
			doh.f(cntr.hasChangedProp("d.e"));
			doh.f(cntr.hasChangedProp("d.f"));
		},

		"Ignore nested property change" : function() {
			var cntr = new ModelRefController({
				ignoredProps : [
					"x.a" // nested simple
				]
			});
			// load hierarchical model
			cntr.loadModelFromData({
				x : {
					a : 1,
					b : 2,
					c : 3
				}
			});
			getChangedAndTest(cntr, true);

			cntr.get("x").set("a", 22); // ignored
			getChangedAndTest(cntr, true);
			doh.f(cntr.isDirty(), "Should not be dirty");

			cntr.get("x").set("b", 33);
			doh.is({
				x : {
					b : 33
				}
			}, getChangedAndTest(cntr, false));

			doh.f(cntr.hasChangedProp("x.a"));
			doh.t(cntr.hasChangedProp("x.b"));
			doh.f(cntr.hasChangedProp("x.c"));
		},

		"Ignore array property change" : function() {
			var cntr = new ModelRefController({
				ignoredProps : [
					"1.a",
					"*.b"
				]
			});
			// load hierarchical model
			cntr.loadModelFromData([
				{
					a : 1,
					b : 2,
					c : 3
				},
				{
					a : 11,
					b : 22,
					c : 33
				}
			]);
			getChangedAndTest(cntr, true);

			cntr.get("0").set("b", 2222); // ignored
			cntr.get("1").set("b", 222); // ignored
			cntr.get("1").set("a", 111); // ignored
			getChangedAndTest(cntr, true);
			doh.f(cntr.isDirty(), "Should not be dirty");

			cntr.get("0").set("a", 1111);
			doh.is([
				{
					a : 1111
				}
			], getChangedAndTest(cntr, false));

			doh.t(cntr.hasChangedProp("0.a"));
			doh.f(cntr.hasChangedProp("0.b"));
			doh.f(cntr.hasChangedProp("1.a"));
			doh.f(cntr.hasChangedProp("1.b"));
		},

		"Ignore widlcard property change" : function() {
			var cntr = new ModelRefController({
				ignoredProps : [
					null
				// will be changed dynamically later
				]
			});
			// load hierarchical model
			cntr.loadModelFromData({
				a : [
					{
						b : [
							{
								c : 1
							},
							{
								c : 2
							}
						]
					},
					{
						b : [
							{
								c : 1
							}
						]
					}
				]
			});
			getChangedAndTest(cntr, true);

			cntr.ignoredProps[0] = "a.0.b.1.c";
			cntr.get("a").get("0").get("b").get("1").set("c", 111); // ignored
			doh.f(cntr.isDirty(), "Should not be dirty (0,1)");
			cntr.get("a").get("0").get("b").get("0").set("c", 222); // not ignored
			doh.t(cntr.isDirty(), "Should be dirty (0,1)");

			cntr.reset();
			cntr.ignoredProps[0] = "a.*.b.*.c";
			cntr.get("a").get("0").get("b").get("0").set("c", 111); // ignored
			cntr.get("a").get("0").get("b").get("1").set("c", 222); // ignored
			cntr.get("a").get("1").get("b").get("0").set("c", 333); // ignored
			doh.f(cntr.isDirty(), "Should not be dirty (*,*)");

			cntr.reset();
			cntr.ignoredProps[0] = "a.0.b.*.c";
			cntr.get("a").get("0").get("b").get("0").set("c", 111); // ignored
			cntr.get("a").get("0").get("b").get("1").set("c", 222); // ignored
			doh.f(cntr.isDirty(), "Should not be dirty (0,*)");
			cntr.get("a").get("1").get("b").get("0").set("c", 333); // not ignored
			doh.t(cntr.isDirty(), "Should be dirty (0,*)");

			cntr.reset();
			cntr.ignoredProps[0] = "a.*.b.0.c";
			cntr.get("a").get("0").get("b").get("0").set("c", 111); // ignored
			cntr.get("a").get("1").get("b").get("0").set("c", 222); // ignored
			doh.f(cntr.isDirty(), "Should not be dirty (*,0)");
			cntr.get("a").get("0").get("b").get("1").set("c", 333); // not ignored
			doh.t(cntr.isDirty(), "Should be dirty (*,0)");

			cntr.reset();
			cntr.ignoredProps[0] = "b";
			cntr.get("a").get("0").get("b").get("1").set("c", 444); // not ignored
			doh.t(cntr.isDirty(), "Should be dirty (b)");
		},

		"Ignore private property change" : function() {
			// two kinds of props are ignored by default
			// __<foo>
			// _<foo>Item

			var cntr = new ModelRefController();
			// load hierarchical model
			cntr.loadModelFromData({
				__foo : 1,
				_fooItem : 2,
				x : {
					__bar : 3,
					_barItem : 4
				}
			});
			getChangedAndTest(cntr, true);

			cntr.set("__foo", 11); // ignored
			cntr.set("_fooItem", 22); // ignored
			cntr.get("x").set("__bar", 33); // ignored
			cntr.get("x").set("_barItem", 44); // ignored
			getChangedAndTest(cntr, true);
			doh.f(cntr.isDirty());

			getChangedAndTest(cntr, true);
		},

		"Get changed properties on model, with 'ensureInChangedValue' feature" : function() {
			var cntr = new ModelRefController({
				ensureInChangedValue : [
					"bar"
				]
			});
			// load empty model
			cntr.loadModelFromData({
				"foo" : 1,
				"bar" : 2,
				"baz" : 3
			});

			var v = cntr.getChangedValue();
			doh.is(2, v.bar);
			doh.is(1, df.keys(v).length, "unexpected properties count");

			cntr.set("foo", 2);
			v = cntr.getChangedValue();
			doh.is(2, v.bar);
			doh.is(2, v.foo);
			doh.is(2, df.keys(v).length, "unexpected properties count");

			cntr.set("bar", 3);
			v = cntr.getChangedValue();
			doh.is(3, v.bar); 
			doh.is(2, v.foo);
			doh.is(2, df.keys(v).length, "unexpected properties count");

		}
	};

	doh.register("ModelRefController", testObject);

});