define([
	"dojo/_base/declare",
	"dojox/form/ListInput",
	"gjax/Collections",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dijit/form/ValidationTextBox",
	"dojo/Stateful",
	"dojox/mvc/getPlainValue"
], function(declare, ListInput, Collections, on, lang, domClass, ValidationTextBox, Stateful, getPlainValue) {

	// summary:
	//      Slightly modified version of ListInput. ListInput doesn't set its value correctly, therefore changes are
	//      not correctly synced to model.

	return declare(ListInput, {

		constructor : function() {
			this.baseClass = "gjaxListInput " + this.baseClass;
		},

		_updateValues : function() {
			// summary:
			//		update this.value and the select node
			// tags:
			//		private
			this._set("value", this._getValues());
			this._setSelectNode();
			this.validate(this._focused);
		},

		_setValueAttr : function(newValue) {
			//added equals check to prevent endless loop after changing value
			if (Collections.equals(newValue, this.get("value"))) {
				return;
			}
			this.inherited(arguments);
		},

		getErrorMessage : function(/*Boolean*/ /*===== isFocused =====*/) {
			// summary:
			//		Return an error message to show if appropriate
			// tags:
			//		protected
			var invalid = !this.invalidMessage ? this.promptMessage : this.invalidMessage;
			var missing = !this.missingMessage ? invalid : this.missingMessage;
			return (this.required && this._isEmpty()) ? missing : invalid; // String
		},

		validate : function() {
			var isValid = this.disabled || this.isValid();

			this.focusNode.setAttribute("aria-invalid", isValid ? "false" : "true");
			var isEmpty = this._isEmpty();
			var error = (this.get("required") && isEmpty && this._hasBeenBlurred) || (!isEmpty && !isValid);

			domClass.toggle(this.domNode, "dijitTextBoxError", error);

			this.set("message", this.getErrorMessage());
			return isValid;
		},

		_isEmpty : function() {
			var val = this.get("value");
			return !val || !val.length;
		},

		isValid : function() {
			return this.get("mismatchedValue").length === 0 && (!this.required || !this._isEmpty());
		},

		_setMessageAttr : function(message) {
			ValidationTextBox.prototype._setMessageAttr.call(this, message);
		},
		tooltipPosition : [],
		displayMessage : function(message) {
			ValidationTextBox.prototype.displayMessage.call(this, message);
		},

		onFocus : function() {
			this.focused = true;
			this.validate();
		},
		onBlur : function() {
			this.focused = false;
			this.validate();
		},

		add : function(values) {
			//original add function uses for (var i in values) which doesn't work well if values is StatefulArray,
			//transforming it to plain array
			if (values && values.length && values.isInstanceOf && values.isInstanceOf(Stateful)) {
				values = getPlainValue(values);
			}
			this.inherited(arguments, [values]);
		},

		startup : function() {
			if (this._started) {
				return;
			}
			this.inherited(arguments);

			this.own(on(this.focusNode, "click", lang.hitch(this, function() {
				this._focusInput();
			})));
		}

	});
});
