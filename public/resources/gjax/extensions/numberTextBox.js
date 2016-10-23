define([
	"dijit/form/NumberTextBox",
	"gjax/_base/kernel",
	"dojo/number",
	"dojo/_base/lang",
	"gjax/lang/blacklistMixin",
	"gjax/log/level"
], function(NumberTextBox, kernel, number, lang, blacklistMixin, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX FIX: NumberTextBox constraints option round");

	var _orgGetValueAttr = NumberTextBox.prototype._getValueAttr;
	NumberTextBox.extend({

		_formatConstraints : function(constraints) {
			// remove defualt min/max - see NumberTextBox._setConstraintsAttr and extensions/rangeBoundTextBox

			// find what default min/max look like (copied from NumberTextBox._setConstraintsAttr)
			var places = typeof constraints.places == "number" ? constraints.places : 0;
			places && places++;
			var defaultVal = 9 * Math.pow(10, 15 - places);

			var ret = blacklistMixin([
				"min",
				"max"
			], {}, constraints);
			constraints.min !== -defaultVal && (ret.min = this._formatter(constraints.min, constraints));
			constraints.max !== defaultVal && (ret.max = this._formatter(constraints.max, constraints));
			return ret;
		},

		_getValueAttr : function() {
			var v = lang.hitch(this, _orgGetValueAttr, arguments)();
			if (kernel.isNumber(v) && this.constraints.round && kernel.isNumber(this.constraints.round)) {
				v = number.round(v, this.constraints.round);
			}
			return v;
		}

	});
});