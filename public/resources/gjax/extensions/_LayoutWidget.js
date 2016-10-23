define([
	"dijit/layout/_LayoutWidget",
	"dojo/_base/lang",
	"dijit/Viewport",
	"dojo/dom-class",
	"gjax/log/level"
], function(_LayoutWidget, lang, Viewport, domClass, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: defer resize of _LayoutWidget prevent useless mutliple resizing");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: _LayoutWidget won't show its child until _setupChild is done");

	var origAddChild = _LayoutWidget.prototype.addChild;

	_LayoutWidget.extend({

		startup : function() {
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under win.doc.body.
			//
			// 		Widgets should override this method to do any initialization
			// 		dependent on other widgets existing, and then call
			// 		this superclass method to finish things off.
			//
			// 		startup() in subclasses shouldn't do anything
			// 		size related because the size of the widget hasn't been set yet.

			if (this._started) {
				return;
			}

			// Need to call inherited first - so that child widgets get started
			// up correctly
			this.inherited(arguments);

			// If I am a not being controlled by a parent layout widget...
			var parent = this.getParent && this.getParent();
			if (!(parent && parent.isLayoutContainer)) {
				// Do recursive sizing and layout of all my descendants
				// (passing in no argument to resize means that it has to glean the size itself)
				this.resize();

				// Since my parent isn't a layout container, and my style *may be* width=height=100%
				// or something similar (either set directly or via a CSS class),
				// monitor when viewport size changes so that I can re-layout.
				// AR: do not resize immediatelly, to prevent useless mutliple resizing (e.g. when window is beeing resized)
				this.own(Viewport.on("resize", lang.hitch(this, "_deferResize")));
			}
		},

		_deferResize : function(changeSize, resultSize) {
			if (this._resizeTimeout) {
				clearTimeout(this._resizeTimeout);
			}
			this._resizeTimeout = setTimeout(lang.hitch(this, function() {
				delete this._resizeTimeout;
				this.resize(changeSize, resultSize);
			}), 150); //TODO: experimetnaly determined value, maybe change
		},

		destroy : function() {
			if (this._resizeTimeout) {
				clearTimeout(this._resizeTimeout);
			}
			this.inherited(arguments);
		},

		addChild : function(/*dijit/_WidgetBase*/child) {
			// add child first places child, only then calls _setupChild
			// we temporarily hide the child until it is not properly set-up
			domClass.add(child.domNode, "gjaxHidden");
			origAddChild.apply(this, arguments);
			domClass.remove(child.domNode, "gjaxHidden");
		}

	});
});