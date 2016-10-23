define([
	"dojo/_base/array",
	"dojo/dom-prop",
	"dojo/text!./templates/_CheckedMultiSelectItem.html",
	"dojox/form/CheckedMultiSelect",
	"gjax/log/level",
	"dojo/aspect",
	"dojo/_base/lang",
	"gjax/encoders/html/encodeSmp"
], function(array, domProp, templateForCheckedMultiSelectItem, CheckedMultiSelect, level, aspect, lang, encHtml) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: CheckedMultiSelect - generating title on label (for elipses)");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: CheckedMultiSelect - setting disabled, readOnly per whole widget");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: CheckedMultiSelect._CheckedMultiSelectItem freezess/unfreezes correctly");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: CheckedMultiSelect._CheckedMultiSelectItem has proper ARIA role and label");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: CheckedMultiSelect drop down is correctly sized");

	CheckedMultiSelect.formCheckedMultiSelectItem.extend({

		templateString : templateForCheckedMultiSelectItem, //MR: aria-labelledby added, JU: role=option added

		postCreate : function() {
			// summary:
			//		Set inner HTML here - since the template gets messed up sometimes
			//		with rich text
			this.inherited(arguments);
			this.labelNode.innerHTML = this.option.label; /* git-qa *///orig dojo code
			domProp.set(this.labelNode, "title", this.option.label);
			// AR: add also name to inner checkboxes, so keyboard navigation works correctly on radios
			// otherwise not working in IE at all, and wrong behaviour (not focusing selected one) in Chrome
			this.checkBox.set("name", this.parent.id);

			this.own(aspect.after(this.checkBox, "_onClick", function() {
				// AR: focus widget, so we correctly display outline, and enable key navigation
				this.focus();
			}));
		},

		postMixInProperties : function() {
			// summary:
			//		Set the appropriate _subClass value - based on if we are multi-
			//		or single-select
			this._type = this.parent.multiple ? {
				type : "checkbox",
				baseClass : "dijitCheckBox"
			} : {
				type : "radio",
				baseClass : "dijitRadio"
			};
			this.option.disabled = this.option.disabled || false;
			this.option.readOnly = this.option.readOnly || false;
			//disabled/readOnly status may be set also by parent==CheckedMultiSelect
			this.disabled = this.option.disabled || !!this.parent.disabled;
			this.readOnly = this.option.readOnly || !!this.parent.readOnly;
			this.inherited(arguments);
		},

		_changeBox : function() {
			// summary:
			//		Called to force the select to match the state of the check box
			//		(only on click of the checkbox)	 Radio-based calls _setValueAttr
			//		instead.
			if (this.get("disabled") || this.get("readOnly")) {
				return;
			}
			if (this.parent.multiple) {
				this.option.selected = this.checkBox.get('value') && true;
			} else {
				this.parent.set('value', this.option.value);
			}
			// fire the parent's change
			this.parent._updateSelection();

			// AR: do not refocus parent, we have focused child, so it is navigable by keys
			// refocus the parent
			//this.parent.focus();
		},

		_freezeChildren : function(on, prop, value, state) {
			// summary:
			//		Freezes/unfreezes internal checkbox.
			return this.checkBox._freeze(on, prop, value, state);
		}

	});

	var originalStartup = CheckedMultiSelect.prototype.startup;
	CheckedMultiSelect.extend({

		//AR: fix: added maxHeight which CheckedMultiSelect passes to dropDown, to ensure the dropDown is correctly sized
		// without this fix, Cms sends undefined, which overrides default -1 value in _HasDropDown
		maxHeight : -1,

		_freezeChildren : function(on, prop, value, state) {
			// summary:
			//		Internal method for freezing children.
			// tags:
			//		protected extension
			if (this.dropDown) {
				this.dropDownButton._freeze(on, prop, value, state);
			}
			array.forEach(this._getChildren(), function(node) {
				if (node && node.set) {
					node._freeze(on, prop, value, state);
				}
			});
		},

		_setDisabledAttr : function(value) {
			// summary:
			//		Disable (or enable) all the children as well
			this.inherited(arguments);
			if (this.dropDown && this.dropDownButton) { //pkrajnik - fixed condition
				this.dropDownButton.set("disabled", value);
			}
			array.forEach(this._getChildren(), function(node) {
				if (node && node.set) {
					node.set("disabled", value);
				}
			});
		},

		startup : function() {
			if (this._started) {
				return;
			}
			originalStartup.apply(this, arguments);
			if (this.dropDownButton) {
				var handle = aspect.before(this.dropDownButton, 'destroy', lang.hitch(this, function() {
					//JM: When destroy is called while dropdown is open, than it`s child is deselected. 
					//But that child is already destroyed (destroy recursive first destroyes child widgets).
					//Deselecting child contains removing class on that menu`s selected destroyed item - which cannot be done on destroyed menu item. 
					//Sollution is to mark given item as already deselected (as it is already destroyed)
					if (this.dropDown && this.dropDownMenu && this.dropDownButton._opened) {
						this.dropDownMenu.selected = null;
					}
					handle.remove(); //explicit handle release is required, because otherwise aspects on destroy would remove this aspect
				}));
			}
		}

	});

	//JM: fix XSS via set store with unsafe data (which creates childs with label used as HTML)
	var originalSetLabel = CheckedMultiSelect.formCheckedMultiSelectMenuItem.prototype._setLabelAttr;
	CheckedMultiSelect.formCheckedMultiSelectMenuItem.extend({
		encodeLabel : true,
		_setLabelAttr : function(label) {
			var args = Array.prototype.slice.call(arguments);
			if (this.encodeLabel && typeof label === 'string') {
				args[0] = encHtml(label);
			}
			originalSetLabel.apply(this, args);
		}
	});

});