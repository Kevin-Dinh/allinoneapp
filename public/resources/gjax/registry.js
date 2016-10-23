/**
 * @author marcus
 * 
 * Extensions for dijit/registry
 * This is OLD !
 * http://dojotoolkit.org/reference-guide/1.7/quickstart/widgetHierarchies.html
 * 
 * Current:
 * http://livedocs.dojotoolkit.org/quickstart/widgetHierarchies
 * 
 * Design Explained:
 * - Do not rely on dijit/WidgetSet API, it is deprectade and will be removed in 2.0 http://bugs.dojotoolkit.org/ticket/15169 
 * 
 * TODO: add docuentation about registry and important widget properties (hierarchy related) to documentation
 * trivial demo/not a testcase is abailable in /tst-ui/src/main/webapp/WEB-INF/views/test/registry/test01.js
 */
define([
	"dojo/_base/lang",
	"dijit/registry",
	"dojo/_base/kernel",
	"gjax/_base/object", 
	"dojo/_base/array"
], function(lang, registry, kernel, gobject, array) {

	var filterFunctions = {

		IS_CONTAINER : function(w) {
			/*jshint laxbreak:true */
			return (!!w.isContainer //old 1.7 version, not used anymore
			|| !!w.getIndexOfChild //duck type for dijit/_Container method)
			);
			//TODO: correct OO instanceOf Container ?
		},
		IS_CONTAINED : function(w) {
			return !!w.getParent();
		},
		HAS_DECLARED_CLASS : function(declaredClass) {
			/* supports prefix matching can specify dijit/form */
			kernel.deprecated(this.declaredClass + "::HAS_DECLARED_CLASS() is deprecated. Use INSTANCE_OF instead.", "", "2.0");

			return function(w) {
				return w.declaredClass.indexOf(declaredClass) === 0;
			};
		},
		WITH_DOM_NODE : function(w) {
			return !!w.domNode;
		},
		WITHOUT_DOM_NODE : function(w) {
			return !w.domNode;
		},
		INSTANCE_OF : function(classOrClassString, /*String?*/flags) {
			// summary:
			//		Finds widget by class. Factory function.
			//		Use ths filter method to find widgets inherited or mixed from "specified widget".
			//		Works with declare inheritance/mixin style
			// classOrClassString: Function|String 
			//		specified widget class
			//		eg. ValidationTextBox, ComboBoxMixin or "dijit.form.ValidationTextBox" /* git-qa */
			// flags:	String?
			//			"exact" means same constructor (no inheritance allowed), 
			//			"instanceof" also those that are instanceof (inherited in js or dojo sense)
			//			"instanceOf" (beware capitals) also those that are mixins (default)
			// returns:	
			//		Filter function returning 
			//		true if same/inherited/or mixed from classOrClassString
			return function(w) {
				if (typeof classOrClassString == "string") { // do nothing 
					classOrClassString = lang.getObject(classOrClassString.replace(/\//g, "."));
				}
				if (!flags || flags === "instanceOf") {//orig behavior, find all kind of inhertance
					return w.isInstanceOf(classOrClassString);
				} else { // after  flags param has been added
					return flags === "exact" /*jshint laxbreak:true*/
					? w.constructor === classOrClassString //most strict exact match
					: w instanceof classOrClassString; //no mixins included
				}
				//TODO: rewrite nicer, TODO: fill testcase

			};
		},
		HAS_MVC_REF : function(searchedRef) {
			// summary:
			//		Find widgets bound to specific model property
			// description:
			//		Use as filter method over array of widgets. Filter to find widgets bound to specific model property.
			// 		Matching is bery lax and searches only based on targetProp.
			//		Implementation is fragile and relies on _refs private property.
			// searchedRef: String
			//		property name from model
			// targetProps: 
			// returns:	
			// 		Filter function, 
			// 		which returns true or false if widget has any reference (.refs) to targetProp with specified ref
			return function(w) {
				// to understand look at mvc _ref structure {value:{targetProp:'abc'},checked:{targetProp:'xyz'},whatever:{targetProp:'surName'}} 
				for ( var binding in w._refs) {
					if (w._refs[binding].targetProp === searchedRef) {
						return true;
					}
				}
				return false;
			};
		},
		ATTACH_POINT : function(myWidget) {
			// summary:
			//		search registry for widgets, containing myWidget as property with name dojoAttachPoint
			// description:
			//		myWidget is part of templated widget and has dojoAttachPoint. Now I need to find
			//		"parentWidget" that references myWidget. Potentially there are more widgets using the same attach point
			//		only one shall point to me.
			// dojoAttachPoint: 
			// TODO: unit test
			/*jshint laxbreak:true*/
			return myWidget.dojoAttachPoint
			// 
			? function(w) {
				//return w[dojoAttachPoint]===myWidget; //this could be easily enough
				return ~array.indexOf(w._attachPoints, myWidget.dojoAttachPoint) && w[myWidget.dojoAttachPoint] === myWidget;
			} // 
			: function() {
				return false;
			};
		}
	};

	var gjaxRegistry = {
		getParentWidgets : function(widget) {
			// summary:
			//		Returns list of ancestor widgets of given widget.
			var parentWidgets = [];
			var parentWidget;
			while ((parentWidget = widget.getParent())) {
				parentWidgets.push(parentWidget);
				widget = parentWidget;
			}
			return parentWidgets;
		},
		freezeAll : function(prop, value, state) {
			// summary:
			//		Iterate through all widgets in registry and call `freeze` on them.
			// description:
			//		Iterate through all widgets in registry and remember state of `prop` property and set it to `value`.
			//		A `state` value can be used to freeze the property in several independent states.
			//		This is usually used to set all widgets to disabled state, with possibility to restore previous state back.
			// prop: String
			//		Property to freeze.
			// value: Any?
			//		Value, that property will be set to, default is `true`
			// state: String?
			//		Optional name of freeze state (must be used to unfreeze again).
			
			var widgets = this.toArray();
			gobject.call(widgets, "freeze", prop, value, state);
		},
		unfreezeAll : function(prop, state) {			
			// summary:
			//		Iterate through all widgets in registry and call `unfreeze` on them.
			// description:
			//		Iterate through all widgets in registry and restore frozen state of `prop` property.
			//		If a property was frozen using `state`, it can be unfrozen only using the same state.
			// prop: String?
			//		Property to unfreeze. If null, unfreezes all props (in specified state)
			// state: String?
			//		Optional name of freeze state.
			
			var widgets = this.toArray();
			gobject.call(widgets, "unfreeze", prop, state);
		}
	};

	return lang.mixin(registry, filterFunctions, gjaxRegistry);
});