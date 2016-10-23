define([
	"dojo/_base/declare",
	"./_CalendarTimeView"
], function(declare, _CalendarTimeView) {
	return declare(null, {
		// summary:
		//		Mixin for the dojox/widget/Calendar which provides
		//		the standard time-view.
		parent : null,

		constructor : function() {
			this._addView(_CalendarTimeView);
		}
	});
});