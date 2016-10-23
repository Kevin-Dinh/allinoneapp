define([
	"dijit/TooltipDialog",
	"gjax/log/level"
], function(TooltipDialog, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: resize tooltip dialog on show");
	TooltipDialog.extend({
		_onShow : function() {
			this.inherited(arguments);
			this.resize();
		}
	});
});