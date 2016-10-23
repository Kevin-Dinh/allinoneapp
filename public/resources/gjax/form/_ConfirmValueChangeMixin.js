/*jshint expr:true */
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/when",
	"dojo/Deferred",
	"dojo/i18n!./nls/_ConfirmValueChange",
	"dijit/form/_DateTimeTextBox",
	"gjax/dialog",
	"gjax/_base/date"
], function(declare, lang, when, Deferred, i18n, _DateTimeTextBox, dialog, gdate) {

	// module:
	//		gjax/form/_ConfirmValueChangeMixin

	return declare(null, {
		// summary:
		//		Mixin to form widgets to confirm value change.
		// description:
		//		If value of widget is changed, confirmation popup dialog is shown to confirm this change.

		confirmMessage : i18n.confirmMessage,

		_syncDef : null, // Synchronisation deferred

		_setValueAttr : function(/*newValue, priorityChange, displayedValue, item*/) {
			// Overrides _FormValueMixin._setValueAttr()		
			var origArgs = arguments;

			if (this._syncDef && !this._syncDef.isFulfilled() && this._settingValue) {
				when(this._syncDef, lang.hitch(this, function(answer) {
					answer && this.inherited(origArgs);
				}));
			} else {
				this._askForConfirmation(origArgs);
			}
		},

		_setItemAttr : function(/*item*/) {
			// Overrides FilteringSelect._setItemAttr()
			var origArgs = arguments;

			if (this._syncDef && !this._syncDef.isFulfilled()) {
				when(this._syncDef, lang.hitch(this, function(answer) {
					answer && this.inherited(origArgs);
				}));
			} else {
				this._askForConfirmation(origArgs);
			}
		},

		_askForConfirmation : function(args) {
			if (this._started && this.applyConfirmation() && !this.dialogShowed && this._isValueChanged(args[0])) {
				this._syncDef = new Deferred();
				this.dialogShowed = true;

				var confirmChange = dialog.question(i18n.confirmLabel, this.confirmMessage);

				when(confirmChange, lang.hitch(this, function(answer) {
					this.dialogShowed = false;
					this._settingValue = true;
					answer ? this.inherited(args) : this.undo();
					this._settingValue = false;
					this._syncDef.resolve(answer);
					this._syncDef = null;
				}));

				return;
			}
			this.inherited(args);
		},

		_isValueChanged : function(newValue) {
			if (!!(newValue) && newValue.constructor === Object) { // Works only fot object literal
				return this.value !== this.store.getIdentity(newValue);
			}

			if (this.isInstanceOf(_DateTimeTextBox)) {
				if (this._isInvalidDate(newValue) || this._isInvalidDate(this.value)) {
					return true;
				}

				return !gdate.equals(this.value, newValue, "datetime");
			}

			return this.value !== newValue;
		},

		applyConfirmation : function() {
			// Can be overriden to apply own confirmation condition
			return true;
		}
	});
});