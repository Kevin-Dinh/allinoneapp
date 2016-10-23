define([
	"dojo/_base/declare",
	"../View",
	"./_ScreenArgsMixin",
	"gjax/performance"
], function(declare, View, _ScreenArgsMixin,  performance) {

	return declare([
		View,
		_ScreenArgsMixin
	], {
		constructor : function() {
			this.baseClass += " gjaxScreen";
		},

		buildRendering : function() {
			this.inherited(arguments);
			this.createMessagePane(); //create mesasge pane to prevent useless lookup
		},

		startup : function() {
			if (this._started) {
				return;
			}
			this.inherited(arguments);
			performance.mark("screen_startup");
		}
	});

});