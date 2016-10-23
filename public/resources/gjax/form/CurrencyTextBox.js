/**
 * widget			CurrencyTextBox
 * created			10/02/2012
 * @author	 		mrepta
 * @description		
 */
define([
	"dojo/_base/declare",
	"dijit/form/NumberTextBox",
	"dojo/dom-construct",
	"dojo/i18n!./nls/CurrencyTextBox",
	"gjax/encoders/html/encodeSmp"
], function(declare, _Widget, domCreate, ctbMessages, encHtml) {
	return declare(_Widget, {
		currency : "USD", //default currency
		currencyClass : "",
		position : "after",

		postCreate : function() {
			this.inherited(arguments);
			this.createLabel();
		},
		createLabel : function() {
			domCreate.create("label", {
				"for" : this.id,
				"innerHTML" : encHtml(ctbMessages[this.currency.toUpperCase() + "_symbol"]),
				"class" : "currencyTextBox " + this.currencyClass
			}, this.domNode, this.position == "before" ? "before" : "after");
		}
	});
});
