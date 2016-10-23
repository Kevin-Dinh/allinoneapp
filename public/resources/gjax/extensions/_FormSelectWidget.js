define([
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-class",
	"dijit/form/_FormSelectWidget",
	"gjax/Collections",
	"gjax/log/level"
], function(lang, array, domClass, _FormSelectWidget, collUtils, level) {

	// http://bugs.dojotoolkit.org/ticket/15038
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: searchAttr and labelAttr added to _FormSelectWidget");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: equals function added to value array created in _setValueAttr");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: default labelAttr (searchAttr) changed to 'name'");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: falsy values in optison (like 0) are not ignored any more");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: watch 'value' callback is now not called multiple times for same values");

	_FormSelectWidget.extend({

		_setValueAttr : function(/*anything*/newValue, /*Boolean?*/priorityChange) {
			// summary:
			//		set the value of the widget.
			//		If a string is passed, then we set our value from looking it up.
			if (!this._onChangeActive) {
				priorityChange = null;
			}
			if (this._loadingStore) {
				// Our store is loading - so save our value, and we'll set it when
				// we're done
				this._pendingValue = newValue;
				return;
			}
			var opts = this.getOptions() || [];
			if (!lang.isArrayLike(newValue)) {
				newValue = [
					newValue
				];
			} else {
				newValue = newValue.concat(); // "clone"
			}
			array.forEach(newValue, function(i, idx) {
				if (!lang.isObject(i)) {
					newValue[idx] = array.filter(opts, function(node) {
						return node.value === i;
					})[0] || {
						value : "",
						label : ""
					};
				}
			}, this);

			// Make sure some sane default is set
			newValue = array.filter(newValue, function(i) {
				return i && i.value != null; // JU: value can be falsy
			});
			if (!this.multiple && (!newValue[0] || newValue[0].value == null) && opts.length) {
				newValue[0] = opts[0];
			}
			array.forEach(opts, function(i) {
				i.selected = array.some(newValue, function(v) {
					return v.value === i.value;
				});
			});
			var val = array.map(newValue, function(i) {
				return i.value;
			}), disp = array.map(newValue, function(i) {
				return i.label;
			});

			// AR: if multiple, value[0] may be undefined if empty array is set as value, in CheckedMultiSelect, selection would not be cleared
			if (typeof val == "undefined" || (!this.multiple && typeof val[0] == "undefined")) {
				return; // not fully initialized yet or a failed value lookup
			}
			this._setDisplay(this.multiple ? disp : disp[0]);

			val.equals = function(other) {
				return collUtils.equals(this, other);
			};

			this.inherited(arguments, [
				this.multiple ? val : val[0],
				priorityChange
			]);
			this._updateSelection();
		},

		getOptions : function(/*anything*/valueOrIdx) {
			// summary:
			//		Returns a given option (or options).
			// valueOrIdx:
			//		If passed in as a string, that string is used to look up the option
			//		in the array of options - based on the value property.
			//		(See dijit/form/_FormSelectWidget.__SelectOption).
			//
			//		If passed in a number, then the option with the given index (0-based)
			//		within this select will be returned.
			//
			//		If passed in a dijit/form/_FormSelectWidget.__SelectOption, the same option will be
			//		returned if and only if it exists within this select.
			//
			//		If passed an array, then an array will be returned with each element
			//		in the array being looked up.
			//
			//		If not passed a value, then all options will be returned
			//
			// returns:
			//		The option corresponding with the given value or index.  null
			//		is returned if any of the following are true:
			//
			//		- A string value is passed in which doesn't exist
			//		- An index is passed in which is outside the bounds of the array of options
			//		- A dijit/form/_FormSelectWidget.__SelectOption is passed in which is not a part of the select

			// NOTE: the compare for passing in a dijit/form/_FormSelectWidget.__SelectOption checks
			//		if the value property matches - NOT if the exact option exists
			// NOTE: if passing in an array, null elements will be placed in the returned
			//		array when a value is not found.
			var lookupValue = valueOrIdx, opts = this.options || [], l = opts.length;

			if (lookupValue == null) { // ju: changed from === undefined to include null
				return opts; // __SelectOption[]
			}
			if (lang.isArrayLike(lookupValue)) {
				return array.map(lookupValue, "return this.getOptions(item);", this); // __SelectOption[]
			}
			if (lang.isObject(valueOrIdx)) {
				// We were passed an option - so see if it's in our array (directly),
				// and if it's not, try and find it by value.
				if (!array.some(this.options, function(o, idx) {
					if (o === lookupValue || (o.value && o.value === lookupValue.value)) {
						lookupValue = idx;
						return true;
					}
					return false;
				})) {
					lookupValue = -1;
				}
			}

			//AR: changed condition from checking string to checking only object to support also number values, but work also for objects (option object)
			//if(typeof lookupValue == "string"){
			if (!lang.isObject(valueOrIdx)) {
				for (var i = 0; i < l; i++) {
					if (opts[i].value === lookupValue) {
						lookupValue = i;
						break;
					}
				}
			}
			if (typeof lookupValue == "number" && lookupValue >= 0 && lookupValue < l) {
				return this.options[lookupValue]; // __SelectOption
			}
			return null; // null
		},

		_getValueFromOpts : function() {
			// summary:
			//		Returns the value of the widget by reading the options for
			//		the selected flag
			var opts = this.getOptions() || [];
			if (!this.multiple && opts.length) {
				// Mirror what a select does - choose the first one
				var opt = array.filter(opts, function(i) {
					return i.selected;
				})[0];
				if (opt && opt.value != null) { // JU: value can be falsy
					return opt.value;
				} else {
					opts[0].selected = true;
					return opts[0].value;
				}
			} else if (this.multiple) {
				// Set value to be the sum of all selected
				return array.map(array.filter(opts, function(i) {
					return i.selected;
				}), function(i) {
					return i.value;
				}) || [];
			}
			return "";
		},

		_getOptionObjForItem : function(item) {
			// summary:
			//		Explicit check for store type added, compared to original impl.
			//
			//		Returns an option object based off the given item.  The "value"
			//		of the option item will be the identity of the item, the "label"
			//		of the option will be the label of the item.

			// remove getLabel() call for 2.0 (it's to support the old dojo/data API)
			var store = this.store;
			var label;
			if (store.getValue) { //explit check for store type (old store)
				// original code, problem with ItemFileReadStore for example where item[this.labelAttr] exists but is array of ...
				// label = (this.labelAttr && this.labelAttr in item) ? item[this.labelAttr] : store.getLabel(item),
				label = this.labelAttr && this.labelAttr.length ? store.getValue(item, this.labelAttr) : store.getLabel(item);
			} else { //new store
				label = item[this.labelAttr];
			}
			var value = (label ? store.getIdentity(item) : null);
			return {
				value : value,
				label : label,
				item : item
			}; // __SelectOption
		},

		reset : function() {
			var origValue = this.get("value");
			this.inherited(arguments);
			this._watchCallbacks("value", origValue, this.get("value"));
		},

		_isEqualValue : function(a, b) {
			if (lang.isArray(a) && lang.isArray(b)) {
				return collUtils.equals(a, b);
			}
			return this.inherited(arguments);
		}

	});
});
