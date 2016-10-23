define([
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojox/mvc/Group",
	"dojo/window", // winUtils.scrollIntoView
	"gjax/log/level",
	"dijit/form/_FormMixin"
], function(lang, array, Group, winUtils, level, _FormMixin) {

	level("debug", "gjax/extensions") && console.debug("GJAX FIX: fixed mvc Group resizing of children (widgets)");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Group.focus added. Use to focus first form widget in group");

	Group.extend({
		buildRendering : function() {
			this.inherited(arguments);
			this.containerNode = this.domNode; //getChildren finds windgets on this.containerNode
		},

		resize : function() {
			array.forEach(this.getChildren(), function(widget) {
				if (widget.resize) {
					widget.resize();
				}
			});
		},

		_getDescendantFormWidgets : _FormMixin.prototype._getDescendantFormWidgets,
		
		focus : function() {
			// summary:
			//		Focuses first enabled widget in group.
			return array.some(this._getDescendantFormWidgets(), function(widget) {
				if (!widget.disabled && widget.focus) {
					winUtils.scrollIntoView(widget.containerNode || widget.domNode);
					widget.focus();
					return true;
				}
			});
		}
	});

});