define([
	"dojo/_base/declare",
	"dijit/form/ComboBoxMixin"
], function(declare, ComboBoxMixin) {

	ComboBoxMixin.extend({
		// use origButton node from _HasDropDown.js, when arrow is hidden whole widget is set as buttonNode
		_setHasDownArrowAttr: function(/*Boolean*/ val){
			this._set("hasDownArrow", val);
			(this._origButtonNode || this._buttonNode).style.display = val ? "" : "none";
		}
	});

});