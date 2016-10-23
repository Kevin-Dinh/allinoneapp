/*jshint expr:true */
/*jshint laxbreak:true */
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojox/mvc/at",
	"dojox/mvc/getPlainValue",
	"dojox/mvc/getStateful",
	"dojox/mvc/EditModelRefController",
	"dojox/mvc/sync",
	"gjax/_base/object",
	"gjax/mvc/EnhancedStateful",
	"gjax/mvc/EnhancedStatefulArray",
	"dojo/_base/array",
	"dojox/lang/functional",
	"gjax/XString",
	"dojo/aspect",
	//
	"dojox/lang/functional/fold"
], function(declare, lang, at, getPlainValue, getStateful, EditModelRefController, sync, gobject, EnhancedStateful, //
EnhancedStatefulArray, array, df, stringUtils, aspect) {

	return declare(EditModelRefController, {
		// _dirtyProp: String
		//		The property name for the 'dirty' flag.
		_dirtyProp : "dirty",

		// _changedProps: Array
		//		List of changed properties in watched model
		_changedProps : null,

		// ensureInChangedValue: Array
		//		List of properties that will be returned by getChangedValue, event if not modified
		ensureInChangedValue : null,

		_setDirtyProp : function() {
			this.set(this._dirtyProp, true);
		},

		// ignoredProps: String[]?
		//		List of property names. Their change will never affect dirty status of this controller
		ignoredProps : null,

		isDirty : function() {
			// summary:
			//		Returns true if thyere are uncommited changes in current model.
			return this.get(this._dirtyProp);
		},

		loadModelFromData : function(data) {
			// summary:
			//		Loads data as current data model.
			// data: Object?
			// 		Defaults to {}.
			// returns: gjax/mvc/ModelRefController

			this.set(this._refSourceModelProp, getStateful(data || {}, this.getStatefulOptions));
			return this;
		},

		// getStatefulOptions: dojox/mvc/getStateful
		//		The options to get stateful object from plain value.
		getStatefulOptions : lang.mixin({}, getStateful, {
			getStatefulObject : function(o) {
				// summary:
				//		Returns the stateful version of the given object.
				//		If it contains items ending with config.resolvedEnumSuffix, adds special item property for binding
				// o: Object
				//		The object.
				// returns: dojo/Stateful

				var stateful = new EnhancedStateful();
				var s;
				for (s in o) {
					var val = getStateful(o[s], this);
					if (val && val.isInstanceOf && val.isInstanceOf(EnhancedStateful)) {
						stateful.set(s, val);
					} else {
						stateful[s] = val;
					}
				}
				return stateful; // dojo/Stateful
			},
			getStatefulArray : function(/*Anything[]*/a) {
				// summary:
				//		Returns the stateful version of the given array.
				// a: Anything[]
				//		The array.

				return new EnhancedStatefulArray(array.map(a, function(item) {
					return getStateful(item, this);
				}, this));
			}
		}),

		// getPlainValueOptions: dojox/mvc/getPlainValue
		//		The options to get plain value from stateful object.
		getPlainValueOptions : lang.mixin({}, getPlainValue, {
			getPlainObject : function(o) {
				var plain = {};
				for ( var s in o) {
					if (!(s in EnhancedStateful.prototype) //
							&& s != "_watchCallbacks" //
							&& s != "_inherited" //
							&& typeof o[s] != "function" //
							&& !(s.indexOf && s.indexOf("_") === 0 && stringUtils.endsWith(s, "Item"))//
							&& (s.indexOf && s.indexOf("__") !== 0)) {
						plain[s] = getPlainValue(o[s], this);
					}
				}
				return plain; // Object
			}
		}),

		getPlainValue : function() {
			// summary:
			//		Returns current model as plain object.
			return getPlainValue(this.model, this.getPlainValueOptions);
		},

		getChangedValue : function() {
			// summary:
			//		Retrieves object of an changed values from loaded model.

			var cachangedProps = (this._changedProps || []).concat(this.ensureInChangedValue || []);

			var part0 = (cachangedProps[0] || "").split(".")[0];
			var isArr = !isNaN(parseInt(part0, 10));

			return df.foldl(cachangedProps, function(changed, propName) {
				// note that _changedProps may contain nested names (thanks to EnhancedStateful)
				var p, context = changed, parts = (propName + "").split(".");
				while (parts.length > 1) {
					p = parts.shift();
					var isArr = !isNaN(parseInt(parts[0], 10)); // array, if next prop is numeric (non-string) index
					context = context[p] || (context[p] = !isArr ? {} : []);
				}
				var val = getNestedValue(this.model, propName);
				if (val && val.isInstanceOf && val.isInstanceOf(EnhancedStateful)) {
					val = getPlainValue(val, this.getPlainValueOptions);
				}
				context[parts.shift()] = val;
				return changed;
			}, !isArr ? {} : [], this);
		},

		hasChangedProp : function(propName) {
			// summary:
			//		Returns true if `propname` has been changed in model.
			// description:
			//		Nested property names, such as "partner.name", can be used.
			//		Note that non-leaf properties (e.g. "partner" when "partner.name" also exists) 
			//		will never be considered as changed.
			return this._changedProps && ~array.indexOf(this._changedProps, propName);
		},

		set : function(name, value) {
			// summary:
			//		Set a property to this. 
			// name: String
			//		The property to set.
			// value: Anything
			//		The value to set in the property.
			// returns: gjax/mvc/ModelRefController
			//		This instance for chaining.

			if (name == this._refSourceModelProp) {
				setRefEditModel(this, this[this._refSourceModelProp], value);
			}
			return this.inherited(arguments);
		},

		resetDirty : function() {
			// summary:
			// 		Reset dirty property and props

			this.set(this._dirtyProp, false);
			this._changedProps = [];
		},

		reset : function() {
			// summary:
			//		Change the model back to its original state.

			this.inherited(arguments);

			// reset dirty property and props
			this.resetDirty();
		},

		commit : function() {
			// summary:
			//		Send the change back to the data source.

			this.inherited(arguments);

			// reset dirty property and props
			this.resetDirty();
		},

		watch : function(/*String[]|String?*/names, /*Function*/callback) {
			// summary:
			//		Extended original watch to be able watch array of properties
			if (lang.isArray(names)) {
				var handles = array.map(names, function(name) {
					return this.own(this.watch(name, callback))[0];
				}, this);
				handles.remove = function() {
					array.forEach(handles, "item.remove();");
				};
				return handles;
			} else {
				return this.own(this.inherited(arguments))[0];
			}
		},

		hasControllerProperty : function(name) {
			// summary:
			//		Returns true if this controller itself owns the given property.
			// name: String
			//		The property name.
			return this.inherited(arguments) || name == this._dirtyProp || name == "_changedProps" || name == "ignoredProps";
		},

		bind : function(targetWidget) {
			// summary:
			//		Use to bind widget to current model.
			// targetWidget: dijit/_Widget|dijit/_Widget[]|Object
			//		Widget(s) to bind. Its "target" property will be bound to model.
			// returns: gjax/mvc/ModelRefController
			//		This instance for chaining.
			// example:
			//	|	personCtrl.bind(this.personForm);
//			//	|	personCtrl.bind([this.personForm, this.personSummaryForm]);

			var s = lang.isArray(targetWidget) ? targetWidget : [
				targetWidget
			];

			gobject.call(s, "set", "target", at(this, "model"));

			return this;
		},

		valuesEqual : function(oldVal, newVal) {
			// summary:
			//		Returns true if this controller consideres `oldVal` and `newVal` equal.
			// returns: Boolean

			// testing if both are NaN
			if (oldVal != oldVal && newVal != newVal) {
				return true;
			}
			// testing if both are undefined, null or "" (which are considered equal by model)
			if ((oldVal == null || oldVal === "") && (newVal == null || newVal === "")) {
				return true;
			}
			// testing if both are same dates
			//TODO compare dates
//			if (gdate.equals(oldVal, newVal)) {
//				return true;
//			}
			if (sync.equals(oldVal, newVal)/* || collUtils.equals(oldVal, newVal, sync.equals)*/) {
				return true;
			}
			return false;
		},
		own : function() {
			// summary:
			//		Track specified handles and remove/destroy them when this instance is destroyed, unless they were
			//		already removed/destroyed manually.
			//		Inspired by dijit/Destroyable

			array.forEach(arguments, function(handle) {
				var destroyMethodName = "destroyRecursive" in handle ? "destroyRecursive" : // remove "destroyRecursive" for 2.0
				"destroy" in handle ? "destroy" : "remove";

				var odh = aspect.before(this, "destroy", function(preserveDom) {
					handle[destroyMethodName](preserveDom);
				});

				// If handle is destroyed manually before this.destroy() is called, remove the listener set directly above.
				var hdh = aspect.after(handle, destroyMethodName, function() {
					odh.remove();
					hdh.remove();
				}, true);
			}, this);

			return arguments; // handle
		}
	});

	function setRefEditModel(ctrl, /*Anything*/old, /*Anything*/current) {

		function toRegExp(/*String|Number*/propName) {
			return RegExp(("^" + propName).replace(/\./g, "\\.").replace(/\*/g, "[^.]+") + "(?:$|\\.)");
		}

		function isIgnored(name) {
			// summary:
			//		Returns true if property is among ignored or ignored by default
			// name: String|Number
			//		Property name, may be nested
			// example:
			//	|	ctrl.ignoredProps = [
			//	|		"firstName", "address", "contact.contactType"
			//	|	];
			//	|
			//	|	isIgnored("firstName"); // true
			//	|	isIgnored("lastName"); // false
			//	|
			//	|	isIgnored("address"); // true
			//	|	isIgnored("address.street"); // true - everything under 'address' prefix is ignored
			//	|
			//	|	isIgnored("contact"); // false 
			//	|	isIgnored("contact.contactType"); // true - only specific nested property is ignored here
			//	|	isIgnored("contact.contactId"); // false 

			var parts = (name + "").split("."), last = parts[parts.length - 1];

			// default ignores
			if (last.indexOf("_") === 0 && stringUtils.endsWith(last, "Item")) {
				// item binding
				return true;
			}
			if (last.indexOf("__") === 0) {
				// private
				return true;
			}

			// custom ignores
			if (ctrl.ignoredProps) {
				for (var i = 0; i < ctrl.ignoredProps.length; i++) {
					if (toRegExp(ctrl.ignoredProps[i]).test(name)) {
						return true;
					}
				}
			}
			return false;
		}

		// this method is called when we set new model into controller
		// this allows us to change dirtyProp attribute always when something in model has been changed
		// as well as monitor names of changed properties
		if (old !== current) {
			ctrl.set(ctrl._dirtyProp, false);
			ctrl._changedProps = [];

			if (ctrl._handle) {
				ctrl._handle.remove();
			}
			//override standard watch method to be able to manipulate dirty property
			ctrl._handle = current.watch(lang.partial(function(ctrl, name, oldVal, newVal) {
				if (isIgnored(name)) {
					return;
				}
				if (!ctrl.valuesEqual(oldVal, newVal)) {
					addChangedProp(ctrl, name, newVal);
					ctrl.set(ctrl._dirtyProp, !!ctrl._changedProps.length);
				}
			}, ctrl));
			ctrl.own(ctrl._handle);
		}
	}

	function addChangedProp(ctrl, propName, currentVal) {
		// this method is called when we change property on model
		ctrl._changedProps || (ctrl._changedProps = []);

		var origPlainObj = getPlainValue(ctrl[ctrl._refOriginalModelProp], ctrl.getPlainValueOptions);

		var changedIndex = array.indexOf(ctrl._changedProps, propName), //
		origValue = getNestedValue(origPlainObj, propName), //
		equalsOrig = ctrl.valuesEqual(origValue, currentVal);

		if (!~changedIndex && !equalsOrig) {
			// not changed yet and differs from original -> add to changed
			ctrl._changedProps.push(propName);
		} else if (~changedIndex && equalsOrig) {
			// already changed and same as original -> remove from changed
			ctrl._changedProps.splice(changedIndex, 1);
		}
	}

	function getNestedValue(stateful, propName) {
		var p, ctx = stateful, parts = (propName + "").split(".");
		while (parts.length > 0 && ctx) {
			p = parts.shift();
			ctx = typeof ctx.get == "function" ? ctx.get(p) : ctx[p];
		}
		return ctx;
	}
});