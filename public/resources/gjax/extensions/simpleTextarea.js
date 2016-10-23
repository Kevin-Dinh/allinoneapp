define([
	"dijit/form/SimpleTextarea",
	"gjax/log/level",
	"dojo/dom-attr"
], function(SimpleTextarea, level, domAttr) {

	level("debug", "gjax/extensions") && console.debug("GJAX FIX: Setting non string value to SimpleTextarea will not crash");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: SimpleTextarea - native placeholder is used instead of non-working dijit solution");

	SimpleTextarea.extend({

		filter : function(/*String*/value) {
			// Override TextBox.filter to deal with newlines... specifically (IIRC) this is for IE which writes newlines
			// as \r\n instead of just \n
			if (value && typeof value == "string") { // JU: added check for string
				value = value.replace(/\r/g, "");
			}
			return this.inherited(arguments);
		},

		_updatePlaceHolder : function() {
			// works natively
		},

		_setPlaceHolderAttr : function(v) {
			this._set("placeHolder", v);
			// use native placeholder - won't work in IE9 and lower
			domAttr.set(this.textbox, "placeholder", v);
		}

	});

});