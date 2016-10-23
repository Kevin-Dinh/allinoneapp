define([
	"dijit/layout/StackController",
	"gjax/log/level"
], function(StackController, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: StackController.StackButton freezess/unfreezes correctly");

	// TODO investigate if same problem occurs for Accordian buttons
	
	StackController.StackButton.extend({
		_freeze : function() {
			// cannot be frozen/unfrozen directly, all attr changes populate from content of StackController
		}
	});

});