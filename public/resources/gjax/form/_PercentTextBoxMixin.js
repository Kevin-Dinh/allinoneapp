/*jshint expr:true */
define([
	"dojo/_base/declare",
	"dojo/i18n!dojo/cldr/nls/number",
	"dojo/_base/lang"
], function(declare, nlsNumber, lang) {

	// module:
	//		gjax/form/_PercentTextBoxMixin

	return declare(null, {
		// summary:
		//		Mixin for NumberTextBox, which allows to enter percent as integers.
		// description:
		//		NumberTextBox with constraints.type==percent allows to enter perctens as decimal numbers, eg 0.5 for 50%
		//		This mixin allows to enter 50 for 50%
		//		(Ported from Unius, PercNumberTextBox)

		_formattedPattern : nlsNumber.percentFormat, // orig in unius "#,###.00 %",

		_setConstraintsAttr : function(constraints) {
			lang.mixin(constraints, {
				pattern : this._formattedPattern,
				type : "percent"
			});
			this.inherited(arguments);
		},

		editOptions : {
			pattern : "#.##"
		},

		format : function(val, constraints) {
			if (!this.focused) {
				val = val && val / 100;
			}
			return this.inherited(arguments, [
				val,
				constraints
			]);
		},

		parse : function(val) {
			var parsed = this.inherited(arguments);
			if (~val.indexOf("%")) {
				return parsed && parsed * 100;
			}
			return parsed;
		}
	});
});