define([
	"dgrid/Selection",
	"dojo/dom-class",
	"gjax/log/level"
], function(Selection, domClass, level) {
	var originSetSelectionMode = Selection.prototype._setSelectionMode;

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: add css class to dgrid according to selection mode");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: prevents selection in disabled grids");
	
	var orig_handleSelect = Selection.prototype._handleSelect;
	
	Selection.extend({
		_setSelectionMode : function(mode) {
			domClass.replace(this.domNode, "selectionMode-" + mode, "selectionMode-" + this.selectionMode);
			return originSetSelectionMode.call(this, mode);
		},
		
		_handleSelect: function(/*event, target*/){
			// Don't run if grid is disabled
			if (this.disabled) {
				return;				
			}
			return orig_handleSelect.apply(this, arguments);
		}
	});
});