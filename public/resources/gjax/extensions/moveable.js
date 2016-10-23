define([
	"dojo/dnd/Moveable",
	"gjax/log/level"
], function(Moveable, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: do not allow dragging with right click, causes conflicts with context menu.");
	var origOnMouseDown = Moveable.prototype.onMouseDown;
	Moveable.extend({
		onMouseDown : function(e) {
			if (e.button === 0) {
				origOnMouseDown.apply(this, [
					e
				]);
			}
		}
	});

});