define([
	"dijit/form/_FormMixin",
	"dojo/_base/array",
	"gjax/_base/dom",
	"gjax/registry",
	"dijit/TitlePane",
	"dojo/window",
	"gjax/log/level"
], function(_FormMixin, array, gdom, gRegistry, TitlePane, winUtils, level) {

	// http://bugs.dojotoolkit.org/ticket/15038
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: expanding closed TitlePanes/Fieldset added to validation");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _FormMixin.focus added. Use to focus first form widget in form");

	_FormMixin.extend({
		validate : function() {
			// summary:
			//		returns if the form is valid - same as isValid - but
			//		provides a few additional (ui-specific) features:
			//
			//		1. it will highlight any sub-widgets that are not valid
			//		2. it will call focus() on the first invalid sub-widget
			//		3. it open closed TitlePane/Fieldset parents of the first invalid sub-widget //AR: added
			var didFocus = false;
			return array.every(array.map(this._getDescendantFormWidgets(), function(widget) {
				// Need to set this so that "required" widgets get their
				// state set.
				widget._hasBeenBlurred = true;
				var valid = widget.disabled || !widget.validate || widget.validate();
				if (!valid && !didFocus) {// Set focus of the first non-valid widget

					// open all title panes from myWidget up the tree
					var parentWidgets = gRegistry.getParentWidgets(widget);
					for ( var i = 0, l = parentWidgets.length; i < l; i++) {
						var w = parentWidgets[i];
						if (w.isInstanceOf(TitlePane) && !w.open) {
							w.set("open", true);
						}
					}

					if (gdom.isDisplayed(widget.domNode)) {
						//if widget is hidden, scrolling behaves strangely
						winUtils.scrollIntoView(widget.containerNode || widget.domNode);
						widget.focus();
					}
					didFocus = true;
				}
				return valid;
			}), function(item) {
				return item;
			});
		},

		isValid : function() {
			// summary:
			//		returns if the form is valid
			return array.every(array.map(this._getDescendantFormWidgets(), function(widget) {
				return widget.disabled || !widget.isValid || widget.isValid();
			}), function(item) {
				return item;
			});
		},

		focus : function() {
			// summary:
			//		Focuses first enabled widget in form.
			return array.some(this._getDescendantFormWidgets(), function(widget) {
				if (!widget.disabled && widget.domNode && gdom.isDisplayed(widget.domNode) && widget.focus) {
					winUtils.scrollIntoView(widget.containerNode || widget.domNode);
					widget.focus();
					return true;
				}
			});
		}
	});
});