define([
	"dijit/TitlePane",
	"dojo/_base/lang",
	"dojo/when",
	"dojo/on",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/i18n!gjax/extensions/nls/titlePane",
	"gjax/_base/dom",
	"gjax/log/level"
], function(TitlePane, lang, when, on, domClass, domConstruct, messages, gdom, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Close feature added to title pane");
	TitlePane.extend({

		closable : false,

		_buildCloseBtn : function() {
			this.closeButton = domConstruct.create("span", {
				"class" : "dijitTitlePaneCloseIcon",
				tabIndex : -1,
				title : messages.close
			}, this.titleNode, "after");
			var handle = on(this.closeButton, "click", lang.hitch(this, function(evt) {
				// stop click event - it will cause toggleable to toggle
				evt.preventDefault();
				evt.stopPropagation();
				this.close(evt);
			}));
			this._trackMouseState(this.closeButton, "dijitTitlePaneCloseIcon");
			this._connects.push(handle);
			domClass.add(this.domNode, "dijitTitlePaneClosable");
		},

		buildRendering : function() {
			this.inherited(arguments);
			if (this.closable) {
				this._buildCloseBtn();
			}
		},

		_setClosableAttr : function(closable) {
			this._set("closable", closable);
			if (this._started) {
				if (closable) {
					if (!this.closeButton) {
						this._buildCloseBtn();
					} else {
						gdom.show(this.closeButton);
					}
				} else if (!closable && this.closeButton) {
					gdom.hide(this.closeButton);
				}
			}
		},

		close : function() {
			if (!this.closable) {
				return;
			}

			var event = {
				stopped : false
			};//TODO event API
			var _this = this;
			_this.onCloseClick(event);
			when(event.stopped, function(stopped) {
				if (!stopped) {
					_this.hide();
					_this.onHide();
				}
			});
		},

		onCloseClick : function(/*def*/) {//TODO refactor and rethink!
		},

		onHide : function() {
		},

		_applyAttributes : function() {
			this.inherited(arguments);
			//this will supress mouse tracking on domnode (tracking is needed only on titleBarNode)
			this.domNode._cssState = undefined;
			//domAttr.remove(this.domNode, "_cssState");
		},

		_setDisabledAttr : function(value) {
			this.inherited(arguments);

			if (value) {
				this.freeze({
					toggleable : false,
					closable : false
				}, "disabled-title-pane");
			} else {
				this.unfreeze(null, "disabled-title-pane");
			}
		},
		_onShow : function() {
			//AR: this will ensure that content will be resized after open
			if (this.open) {
				// this is case when someone calls _onShow on opened titlePane (_ContentPaneResizeMixin:resize>_layout)
				this._needLayout = true;
				this.inherited(arguments);
			} else {
				// this is case, when someone opens the titlePane (open attr is not set to true yet, so we can detect it)
				// we need to wait until open animation finishes
				var args = arguments;
				this.defer(function() {
					this._needLayout = true;
					this.inherited("_onShow", args);
				}, this.duration);
			}
		}

	});
});