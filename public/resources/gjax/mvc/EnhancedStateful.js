define([
	"dojo/Stateful",
	"dojo/_base/declare",
	"dojo/_base/config",
	"gjax/XString",
	"dojo/json",
	"dojox/lang/functional"
], function(Stateful, declare, config, stringUtils, json, df) {

	//experimental

	var resolvedEnumSuffix = config.resolvedEnumSuffix || "Label";

	var _HierarchicalStatefulMixin = declare(null, {

		_watchCount : 0,
		_watchedProps : null,
		_watchedPropsHandles : null,

		_getParentProp : function(value, parentObj, origParentProp) {
			//to be overriden by EnhancedStatefulArray
			return origParentProp;
		},

		watch : function() {

			var _this = this;

			//setup watching children on first watch, and remove on last
			if (this._watchCount === 0) {
				var _watchedProps = this._watchedProps || (this._watchedProps = {});
				var _handles = this._watchedPropshandles || (this._watchedPropsHandles = []);
				var h;

				//setup watching for existing props
				df.forIn(this, function(value, prop) {
					if (this.hasOwnProperty(prop) && value && value.isInstanceOf && value.isInstanceOf(_HierarchicalStatefulMixin)) {
						h = _watchedProps[prop] = value.watch(function(subProp, oldVal, newVal) {
							/*jshint expr:true */
							_this._watchCallbacks && _this._watchCallbacks(_this._getParentProp(value, _this, prop) + "." + subProp, oldVal, newVal);
						});
						_handles.push(h);
					}
				}, this);

				//setup watching for changed props
				//this.inherited is not used due to usage in EnhancedStatefulArray
				h = Stateful.prototype.watch.call(this, function(prop, oldVal, newVal) {
					if (_watchedProps[prop]) {
						//remove watch for old value (if any)
						_watchedProps[prop].remove();
						delete _watchedProps[prop];
					}
					//setup new watch
					if (_this.hasOwnProperty(prop) && newVal && newVal.isInstanceOf && newVal.isInstanceOf(_HierarchicalStatefulMixin)) {
						h = _watchedProps[prop] = newVal.watch(function(subProp, oldVal2, newVal2) {
							/*jshint expr:true */
							_this._watchCallbacks && _this._watchCallbacks(_this._getParentProp(newVal, _this, prop) + "." + subProp, oldVal2, newVal2);
						});
						_handles.push(h);
					}
				});
				_handles.push(h);
			}

			//call original watch method
			this._watchCount++;
			var origHandle = Stateful.prototype.watch.apply(this, arguments);
			//this.inherited is not used due to usage in EnhancedStatefulArray
			//var origHandle = this.inherited(arguments);

			var _h = {
				remove : function() {
					//remove handle from original watch
					if (_h._removed) {
						return;
					}
					origHandle.remove();
					_this._watchCount--;
					//and if there is noone else watching, remove watch of child statefuls
					if (_this._watchCount === 0) {
						df.forEach(_this._watchedPropsHandles, "h.remove()");
						delete _this._watchedPropsHandles;
						delete _this._watchedProps;
					}
					_h._removed = true;
				},
				unwatch : function() {
					_h.remove();
				}
			};
			return _h;
		}
	});
	var _ResolvedItemMixin = declare(null, {
		set : function(prop, value) {
			this.inherited(arguments);
			var itemName, propertyNameBase, resolvedProp;

			if (prop.indexOf && prop.indexOf("_") === 0 && stringUtils.endsWith(prop, "Item")) {
				if (this[prop] != value) {
					// When AFTER this.inherited(arguments) item `prop` is not set to `value` something is very wrong.
					// This situation will occure, if calling inherited has already synchronously set the item
					// AND it differs from our `value` (this will happen e.g. when id cannot be found in sync store)
					return;
				}

				//Setting _*Item into model
				var name = prop.substring(1, prop.length - 4);
				value = json.parse(value);
				if (value.id == this[name] && value.name === undefined) {
					// This situation will occure, if calling inherited has already synchronously (memoryStore, etc.)
					// set id and name (and also item)
					return;
				}
				this.set(name, value.id);
				propertyNameBase = name.lastIndexOf("Id") + 2 == name.length ? name.substring(0, name.length - 2) : name;
				resolvedProp = value.resolvedProp || (propertyNameBase + resolvedEnumSuffix);
				this.set(resolvedProp, value.name);
			} else if ((itemName = ("_" + prop + "Item")) in this) {
				//Setting ID into model
				var item = json.parse(this[itemName]);
				if (item.id != value) {
					propertyNameBase = prop.lastIndexOf("Id") + 2 == prop.length ? prop.substring(0, prop.length - 2) : prop;
					resolvedProp = item.resolvedProp || (propertyNameBase + resolvedEnumSuffix);
					item = {
						id : value
					};
					delete this[resolvedProp];
					this.set(itemName, json.stringify(item));
				}
			}
		}
	});

	var EnhancedStateful = declare([
		Stateful,
		_HierarchicalStatefulMixin,
		_ResolvedItemMixin
	], {
	// summary:
	//		Enhanced dojo/stateful 
	// description:
	//		Enhanced dojo/stateful that can handle watching children stateful properties & resolved items
	});

	EnhancedStateful._ResolvedItemMixin = _ResolvedItemMixin;
	EnhancedStateful._HierarchicalStatefulMixin = _HierarchicalStatefulMixin;

	return EnhancedStateful;
});
