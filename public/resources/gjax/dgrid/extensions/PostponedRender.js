define([
	"dojo/_base/lang",
	"dojo/_base/declare",
	"gjax/_base/dom",
	"dojo/ready"
], function(lang, declare, gDom, ready) {

	//inspired by previous extension of DataGrid
	//https://gitsrv01/git/?p=Framework-UI;a=blob;f=extensions/grid/DataGrid.js;hb=refs/heads/sub-gjax-denovius-re

	return declare(null, {
		// summary:
		//		dgrid extension that ensures that store is fetched only if grid is displayed
		// description:
		//		Extension checks (in refresh method) if parent node of grid is displayed, 
		//		if not the store is not fetched and '_refreshPostponed' flag is set to true.
		//		In next calls of 'resize' this flag is checked, and store is fetched if node is displayed now.

		// forceRender: Boolean
		//		Should be grid rendered even if it is not displayed (default false)
		forceRender : false,

		refresh : function() {
			//check if parent node is displayed, if no, do not call parent (which would query store)
			if (!gDom.isDisplayed(this.domNode.parentNode) && !this.forceRender) {
				this._refreshPostponed = true;
				if (!this._readyHandle) {
					//maybe ready was not fired yet, and so e.g. some overlay may be displayed, which will be removed in ready
					//init loading
					//TODO: find better way
					ready(1001, lang.hitch(this, "resize"));
					this._readyHandle = true;
				}
				return;
			}
			return this.inherited(arguments);
		},

		resize : function() {
			// description:
			//		if refresh (querying store) was postponed (by 'refresh method'), 
			//		check if the grid should be rendered now, and call refresh if yes
			if (this._refreshPostponed && gDom.isDisplayed(this.domNode.parentNode)) {
				delete this._refreshPostponed;
				this.refresh();
			}
			this.inherited(arguments);
		}
	});

});