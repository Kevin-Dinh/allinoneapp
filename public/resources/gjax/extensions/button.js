define([
	"dijit/form/Button",
	"dojo/dom-attr",
	"gjax/log/level"
], function(Button, domAttr, level) {

	level("debug", "gjax/extensions")
			&& console.debug("GJAX FIX: Remove disabled attribute from button's focusNode - span has no disabled attr, it breaks styling in IE9");

	Button.extend({
		_setDisabledAttr : function(/*Boolean value*/) {
			this.inherited(arguments);
			domAttr.remove(this.focusNode, "disabled");
		}
	});

});