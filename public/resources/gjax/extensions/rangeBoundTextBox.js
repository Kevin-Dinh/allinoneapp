define([
	"dijit/form/RangeBoundTextBox",
	"gjax/log/level",
	"dojo/i18n!gjax/extensions/nls/form",
	"dojo/i18n!dijit/form/nls/validate",
	"dojo/string"
], function(RangeBoundTextBox, level, messages, dojoMessages, string) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: RangeBoundTextBox rangeMessage shows what range is actually allowed");

	RangeBoundTextBox.extend({

		rangeMessage : "$_dynamic_$",

		_formatConstraints : function(constraints) {
			// can be overriden (format dates etc ...)
			return constraints;
		},

		_buildRangeMessage : function(constraints) {
			constraints = this._formatConstraints(constraints);
			var hasMin = "min" in constraints && constraints.min != null;
			var hasMax = "max" in constraints && constraints.max != null;
			var msg = messages["rangeMessage" + (hasMin ? "Min" : "") + (hasMax ? "Max" : "")];
			return msg ? string.substitute(msg, constraints) : dojoMessages.rangeMessage;
		},

		getErrorMessage : function(isFocused) {
			var v = this.get('value');
			if (v != null /* and !undefined */&& v !== '' && (typeof v != "number" || !isNaN(v)) && !this.isInRange(isFocused)) { // don't check isInRange w/o a real value
				// if dynamic range message is used, build it and return
				return this.rangeMessage == "$_dynamic_$" ? this._buildRangeMessage(this.constraints) : this.rangeMessage; // String
			}
			return this.inherited(arguments);
		}

	});

});