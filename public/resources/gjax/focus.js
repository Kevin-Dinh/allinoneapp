define([
	"dijit/registry",
	"dijit/focus"
], function(registry, focus) {

	return {

		blurCurrentWidget : function() {
			// summary:
			//		Calls _onBlur on currently focused widget.
			// description:
			//		Use to ensure that value of currently focused widget was set (to widget.value, model, etc.)
			//		(which normally happens when you focus something else).
			//
			//		In other words, this ensures that any "just typed" data will be prodessed even if that field was not unfocused yet.
			var w = focus.curNode && registry.getEnclosingWidget(focus.curNode);
			if (w && w._onBlur) {
				w._onBlur();
			}
		}

	};

});