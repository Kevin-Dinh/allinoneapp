define([
	"dojo/html",
	"dijit/form/FilteringSelect",
	"dojo/_base/lang",
	"dojo/json",
	"dojo/when",
	"gjax/log/level",
	"dojo/_base/array"
], function(html, FilteringSelect, lang, json, when, level, array) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: FilteringSelect default 'required' value set to false");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: FilteringSelect clear value if needed after store or query updated");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: FilteringSelect do not cast values to strings");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: FilteringSelect now has resolvedItem setter");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: FilteringSelect now reuses previous item if exists");

	FilteringSelect.extend({
		required : false,

		resolvedProp : null,
		_setResolvedPropAttr : function(resolvedProp) {
			this._set("resolvedProp", resolvedProp);
			var eri = {
				"id" : null,
				"name" : null
			};
			if (resolvedProp) {
				eri.resolvedProp = resolvedProp;
			}
			this._emptyResolvedItem = json.stringify(eri);
		},

		_emptyResolvedItem : '{"id":null,"name":null}',

		_setQueryAttr : function(query) {
			//setter does not exists on parent
			this._set("query", query);
			this._handleStoreChange();
		},

		_setStoreAttr : function(store, doNotRevalidateCurrentValue) {
			this.inherited(arguments);
			!doNotRevalidateCurrentValue && this._handleStoreChange();
		},

		_handleStoreChange : function() {
			//clears current value, if it becomes invalit after changing the query
			var handle = this.watch("value", function() {
				handle.remove();
				if (!this.isValid()) {
					this.set("value", null);
				}
			});
			//setter of displayedValue will ensure revalidation
			if (this.displayedValue && this.displayedValue.length > 0) {
				this.set("displayedValue", this.displayedValue);
			}
		},

		_getValueAttr : function() {
			// summary:
			//		Hook for get('value') to work.

			// don't get the textbox value but rather the previously set hidden value.
			// Use this.valueNode.value which isn't always set for other MappedTextBox widgets until blur
			return this.valueNode.actualValue;
		},

		_setValueAttr : function(/*String|Object*/value, /*Boolean?*/priorityChange, /*String?*/displayedValue, /*item?*/item) {
			// summary:
			//		Hook so set('value', value) works.
			// description:
			//		Sets the value of the select.
			//		Also sets the label to the corresponding value by reverse lookup.
			if (!this._onChangeActive) {
				priorityChange = null;
			}

			if (item === undefined) {
				if (value == null || value === "") {
					this._set("displayedValue", "");
					this.valueNode.value = "";
					this.valueNode.actualValue = "";
					this.focusNode.value = "";
					this._set("value", value);
					this._set("item", null); //_AutoCompleterMixin
					this._set("resolvedItem", this._emptyResolvedItem);
					this.validate(this.focused);//ValidationTextBox
					this._updatePlaceHolder();//TextBox
					return;
				}
				// JU do we need this?
//				if (value === null || value === '') {
//					value = '';
//					if (!lang.isString(displayedValue)) {
//						this._setDisplayedValueAttr(displayedValue || '', priorityChange);
//						return;
//					}
//				}

				var self = this;
				this._lastQuery = value;
				var prevItem;
				if (this.item && this.value == value) {
					//AR: reuse previous item, if the value is the same
					// we could also test if values are equal and return, but we want to keep
					// original behaviour of widget
					// (without extension, useles store.get is executed, when FS is bound to model, 
					//	which will reflect new value back (without item in setter))
					prevItem = this.item;
				}
				when(self._interStoreDef)// REVIEW: what is _interStoreDef??
				.then(function() {
					return when(prevItem || self.store.get(value))//
					.then(function(item) {
						if (!self._destroyed) {
							self._callbackSetLabel(item ? [
								item
							] : [], undefined, undefined, priorityChange);
						}
					});
				})//
				.otherwise(lang.hitch(this, "errorHandler"));
			} else {
				if (value == null || value === "") {
					this._set("resolvedItem", this._emptyResolvedItem);
				}
				this.valueNode.value = value;
				this.valueNode.actualValue = value; // to save value without casting it to string
				if (displayedValue) {
					// set displayed value directly and call watch callbacks
					var oldValue = this.displayedValue;
					this.displayedValue = displayedValue;
					if (this._watchCallbacks) {
						this._watchCallbacks("displayedValue", oldValue, displayedValue);
					}
				}
				this.inherited(arguments, [
					value,
					priorityChange,
					displayedValue,
					item
				]);
			}
		},
		reset : function() {
			this.item = null; //_AutoCompleteMixin
			this.valueNode.value = ''; //MappedTextBox
			this._maskValidSubsetError = true; //ValidationTextBox
			this.textbox.value = ''; //_TextBoxMixin
			this._hasBeenBlurred = false;//_FormValueMixin
			this.displayedValue = "";
			if (this._resetValue) {
				this._setValueAttr(this._resetValue, true, "");
			} else {
				this._setValueAttr(this._resetValue, true, "", null);//_FormValueMixin - overriden - to supress store fetching
			}
			this._set("resolvedItem", this._emptyResolvedItem);
		},

		/* resolved enums */
		_setResolvedItemAttr : function(resolvedItem) {
			this._set("resolvedItem", resolvedItem);
			resolvedItem = json.parse(resolvedItem);
			if (resolvedItem.name) {
				var item = this.get("item");
				if (!(item && item[this.store.idProperty] == resolvedItem.id && item[this.searchAttr] == resolvedItem.name)) {
					var realItem = {
						isResolvedItem : true
					};
					realItem[this.store.idProperty] = resolvedItem.id;
					realItem[this.searchAttr] = resolvedItem.name;
					this.set("item", realItem);
				}
			} else {
				this.set("value", resolvedItem.id);
			}
		},
		_setItemAttr : function(/*item*/item) {
			this.inherited(arguments);
			this._lastDisplayedValue = this.textbox.value;
			var resolvedItem = this._emptyResolvedItem;
			if (item) {
				var resolvedItemObj = {
					id : item[this.store.idProperty],
					name : item[this.searchAttr]
				};
				if (this.resolvedProp) {
					resolvedItemObj.resolvedProp = this.resolvedProp;
				}
				resolvedItem = json.stringify(resolvedItemObj);
			}
			if (this.resolvedItem != resolvedItem) {
				this.set("resolvedItem", resolvedItem);
			}
		},

		_setDisplayedValueAttr : function(/*String*/label, /*Boolean?*/priorityChange) {
			// summary:
			//		Hook so set('displayedValue', label) works.
			// description:
			//		Sets textbox to display label. Also performs reverse lookup
			//		to set the hidden value.  label should corresponding to item.searchAttr.

			if (label == null) {
				label = '';
			}

			// This is called at initialization along with every custom setter.
			// Usually (or always?) the call can be ignored.   If it needs to be
			// processed then at least make sure that the XHR request doesn't trigger an onChange()
			// event, even if it returns after creation has finished
			if (!this._created) {
				if (!("displayedValue" in this.params)) {
					return;
				}
				priorityChange = false;
			}

			// Do a reverse lookup to map the specified displayedValue to the hidden value.
			// Note that if there's a custom labelFunc() this code
			if (this.store) {
				this.closeDropDown();
				var query = lang.clone(this.query); // #6196: populate query with user-specifics

				// Generate query
				var qs = this._getDisplayQueryString(label), q;
				if (this.store._oldAPI) {
					// remove this branch for 2.0
					q = qs;
				} else {
					// Query on searchAttr is a regex for benefit of dojo/store/Memory,
					// but with a toString() method to help dojo/store/JsonRest.
					// Search string like "Co*" converted to regex like /^Co.*$/i.
					q = this._patternToRegExp(qs);
					q.toString = function() {
						return qs;
					};
				}
				this._lastQuery = query[this.searchAttr] = q;

				// If the label is not valid, the callback will never set it,
				// so the last valid value will get the warning textbox.   Set the
				// textbox value now so that the impending warning will make
				// sense to the user
				this.textbox.value = label;
				this._lastDisplayedValue = label;
				this._set("displayedValue", label); // for watch("displayedValue") notification

				///MR: added calling queryFunc to be able to affect how query will looks like
				if (!label) {
					// AR: in case of empty label, do not call store, its useless
					// just call the method, that would be called after store return
					// we may set empty options, _callbackSetLabel does not do anything with them
					this._callbackSetLabel([], query, {}, priorityChange);
				} else {
					this._fetchQuery(query, priorityChange);
				}
			}
		},

		_fetchQuery : function(query, priorityChange) {
			var _this = this;
			var options = {
				ignoreCase : this.ignoreCase,
				deep : true
			};
			lang.mixin(options, this.fetchProperties);
			///MR: added calling queryFunc to be able to affect how query will looks like
			this._fetchHandle = this.store.query(this.queryFunc(query), options);
			when(this._fetchHandle, function(result) {
				if (!_this._destroyed) { //check whether widget still exists, if it was destroyed before resolving fetchHandle, this would cause error
					_this._fetchHandle = null;

					//JM: in case of repeating labels (result set with multiple items) in store - use store item that has old value (if present), not just random first one
					var value = _this.get('value'), idProperty = _this.store && _this.store.idProperty;
					if (lang.isArray(result) && result.length > 1 && value && idProperty) {
						array.some(result, function(item) { //find first item with value equals old value, and set it as new result set
							if (item && item[idProperty] === value) {
								//We are doing this function for this by product (for this assignment)
								return (result = [
									item
								]);
							}
							return false;
						});
					}

					_this._callbackSetLabel(result || [], query, options, priorityChange);
				}
			}, function(err) {
				_this._fetchHandle = null;
				if (!_this._cancelingQuery) { // don't treat canceled query as an error
					//console.error('dijit/form/FilteringSelect: ' + err.toString());
					//MR: display message for user
					_this.errorHandler(err);
				}
			});
		},

		destroy : function() {
			this.inherited(arguments);
//			this._fetchHandle.cancel();
		}
	});

});