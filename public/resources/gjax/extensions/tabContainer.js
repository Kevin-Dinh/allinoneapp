define([
	"dijit/layout/TabContainer",
	"dojo/dom-geometry",
	"gjax/log/level"
], function(TabContainer, domGeom, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX FIX: TabContainer - resize may call change of width - so another resize is needed");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: TabContainer - layout after child was changed");

	//see /tst/ui/test/tab-resize-bug/sample.raw

	TabContainer.extend({
		resize : function() {
			var wBefore = domGeom.getMarginBox(this.domNode).w;
			var wTablistBefore = domGeom.getMarginBox(this.tablist.domNode).w;

			this.inherited(arguments);

			var wAfter = domGeom.getMarginBox(this.domNode).w;
			var wTablistAfter = domGeom.getMarginBox(this.tablist.domNode).w;

			if (wBefore != wAfter || wTablistBefore != wTablistAfter) {
				this.resize();
			}
		},

		//AR: Changing of selectedChild may cause width change of parent element (e.g. because of scrollbars)
		// e.g. if we have tab container with do layout false, and we select a tab, which is longer, and scrollbar is added,
		// tab controller is not resized properly

		selectChild : function() {
			this.inherited(arguments);
			this.layout();
		}
	});
});