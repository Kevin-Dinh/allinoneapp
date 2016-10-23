define([
	"dojo/_base/declare",
	"dojox/layout/FloatingPane",
	"dojo/dom-geometry",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/sniff",
	"dijit/_WidgetsInTemplateMixin",
	"gjax/_ViewMixin",
	"gjax/_MessagePaneMixin",
	"dijit/_CssStateMixin",
	"dojo/Deferred",
	"dojo/window",
	"dojo/dom-construct",
	"gjax/message/MessagePane",
	"dijit/_base/manager", // manager.defaultDuration
	"dojo/dnd/Moveable", // Moveable
	"dojo/dnd/TimedMoveable", // TimedMoveable
	"dojo/query",
	"dojo/aspect"
], function(declare, FloatingPane, domGeom, domStyle, domClass, lang, win, has, _WidgetsInTemplateMixin, _ViewMixin, _MessagePaneMixin, _CssStateMixin,
		Deferred, winUtils, domConstruct, MessagePane, manager, Moveable, TimedMoveable, query, aspect) {

	return declare([
		FloatingPane,
		_WidgetsInTemplateMixin,// FloatingPane by default does not mixin in this, we can safely mix it now, it does not override any methods
		_ViewMixin,
		_MessagePaneMixin,
		_CssStateMixin
	], {

		// reusable: [protected] Boolean
		//		Indicates if the same instance can be reopened. Default: false.
		reusable : false,

		// _closeDeferred: [private] dojo/Deferred
		//		This is the `dojo/Deferred` that is instanced on each 'open and resolved 
		//		when dialog is closed
		_closeDeferred : null,

		// _closeDeferredValue: [private]
		//		value that _closeDeferred will be resolved with
		_closeDeferredValue : undefined,

		// contentTemplateString: [protected] String
		//		template that will be used as dialog content
		contentTemplateString : "",

		// contentSize: Object
		// 		Object defining size of the widget, default: {w:600,h:400}
		contentSize : {
			w : 600,
			h : 400
		},

		hideCloseButton : false,

		duration : manager.defaultDuration,

		dockable : false,

		_alreadyInitialized : false,

		cssStateNodes : {
			closeNode : "dijitDialogCloseIcon"
		},

		constructor : function() {
			this.baseClass += " templatedDialog templatedFloatingPane";
			this.ownerDocumentBody = win.body(document);
		},

		postCreate : function() {
			this.ownerDocumentBody.appendChild(this.domNode);

			this.inherited(arguments);
		},

		buildRendering : function() {
			// Add content template inside original dialog template
			this.templateString = this.templateString.replace(
					/<div dojoAttachPoint="containerNode" role="region" tabindex="-1" class="\$\{contentClass\}">\s*<\/div>/,
					'<div data-dojo-attach-point="containerNode" role="region" tabindex="-1" class="${contentClass}">' + // 
					this.contentTemplateString + '</div>');

			this.inherited(arguments);
			this.containerWrapperNode = domConstruct.create("div", {
				className : "templatedDialogContainerWrapper"
			}, this.canvas);
			domConstruct.place(this.containerNode, this.containerWrapperNode);

			domClass.add(this.closeNode, "dijitDialogCloseIcon");
			domClass.remove(this.closeNode, "dojoxFloatingCloseIcon");

			this.titleBar = query(".dojoxFloatingPaneTitle", this.domNode)[0];
			domClass.add(this.titleBar, "dijitDialogTitleBar");

			this.messagePaneRef = new MessagePane({});
			this.messagePaneRef.placeAt(this.containerNode, "first");
			this.messagePaneRef.startup();
			this.own(this.messagePaneRef);

			if (this.closable) {
				domClass.add(this.titleBar, "gjaxDialogTitleBarClosable");
			}

//			if (this.resizable) {
//				var rh = this._resizeHandle = new ResizeHandle({
//					targetId : this.id,
//					resizeAxis : this.resizeAxis
//				});
//
//				rh.placeAt(this.domNode);
//				this.own(rh);
//			}

		},

		startup : function() {
			if (this._started) {
				return;
			}
			this.inherited(arguments);

			if (this.hideCloseButton) {
				domStyle.set(this.closeNode, "display", "none");
			}
		},

		_setHideCloseButtonAttr : function(value) {
			this._set("hideCloseButton", value);
			domStyle.set(this.closeNode, "display", value ? "none" : "block");
		},

		_position : function() {
			// summary:
			//		Position the dialog in the viewport.  If no relative offset
			//		in the viewport has been determined (by dragging, for instance),
			//		center the dialog.  Otherwise, use the Dialog's stored relative offset,
			//		adjusted by the viewport's scroll.
			if (!domClass.contains(this.ownerDocumentBody, "dojoMove")) { // don't do anything if called during auto-scroll
				var node = this.domNode, //
				viewport = winUtils.getBox(this.ownerDocument), // 
				p = this._relativePosition, bb = p ? null : domGeom.getMarginBox(node), //
				l = Math.floor(viewport.l + (p ? p.x : (viewport.w - bb.w) / 2)), //
				t = Math.floor(viewport.t + (p ? p.y : (viewport.h - bb.h) / 2));
				
				domStyle.set(node, {
					left : l + "px",
					top : t + "px"
				});
				
				this.bringToTop();
			}
		},

		_endDrag : function() {
			var nodePosition = domGeom.position(this.domNode), viewport = winUtils.getBox(this.ownerDocument);
			nodePosition.y = Math.min(Math.max(nodePosition.y, 0), (viewport.h - nodePosition.h));
			nodePosition.x = Math.min(Math.max(nodePosition.x, 0), (viewport.w - nodePosition.w));
			this._relativePosition = nodePosition;
			this._position();
		},

		_setup : function() {
			// summary:
			//		Stuff we need to do before showing the Dialog for the first
			//		time (but we defer it until right beforehand, for
			//		performance reasons).
			// tags:
			//		private

			var node = this.domNode;

			if (this.titleBar) { // PM: inspired by dijit/Dialog, reload floating pane on last dragged position
				var MoveableClass = (has("ie") == 6) ? TimedMoveable : Moveable;
				this._moveable = new MoveableClass(node, {
					handle : this.titleBar
				});
				aspect.after(this._moveable, "onMoveStop", lang.hitch(this, "_endDrag"), true);
			}
		},

		resetDialog : function() {
			// summary:
			//		Method that is called on each dialog open. It should be used to clear the dialog state before reopening.
			// tags:
			//		protected
		},

		show : function() {

			if (!this._alreadyInitialized) {
				this._setup();
				this._alreadyInitialized = true;
			}

			// call mathod that may clear the dialog
			this.resetDialog();

			var showDeferred = new Deferred();
			// preserve original FT funcionality, show takes callback as argument
			var callback = typeof arguments[0] == "function" && arguments[0];
			this.inherited(arguments, [
				lang.hitch(this, function() {
					callback && callback();
					showDeferred.resolve(/*TODO value?*/);
				})
			]);

			// prepare returned deferred - resolves on close & has showDeferred as property
			var retDfd = new Deferred();
			showDeferred.then(lang.hitch(this, function() {
				// create new instance of _closeDeferred
				this._closeDeferred = new Deferred();
				this._closeDeferredValue = null;
				// call resize so child widget will get sized
				this.resize();
				this._position();
				this._closeDeferred.then(lang.hitch(retDfd, "resolve"), lang.hitch(retDfd, "reject"));
			}));
			retDfd.showDeferred = showDeferred;
			return retDfd;
		},

		_handleHide : function() {
			// deferred is resolved with value of _closeDeferredValue, which is undefined by default
			// but may be set anytime during the dialog is shown
			this._closeDeferred.resolve(this._closeDeferredValue);

			// destroy the dialog on close if it is not reusable
			if (!this.reusable) {
				setTimeout(lang.hitch(this, "destroyRecursive"), this.duration);
			}
		},

		hide : function() {
			// preserve original FT funcionality, show takes callback as argument
			var callback = typeof arguments[0] == "function" && arguments[0];
			
			this.inherited(arguments, [
				lang.hitch(this, function() {
					callback && callback();
					this._handleHide();
				})
			]);

			if (this._relativePosition) {
				delete this._relativePosition; // PM: remove relative position, next open will be centered again, inspired by dijit/Dialog
			}
		},

		close : function(value) {
			// summary:
			//		Close and destroy this widget
			if (!this.closable) {
				return;
			}
			if (!(value instanceof window.Event)) {
				this._closeDeferredValue = value;			
			}
			this.hide();
		},

		_contentSize : function() {
			// summary:
			//		Set dialog size according to contentSize attribute
			// tags:
			//		private

			// set size of container node
			var contentNodeSize = lang.clone(this.contentSize);
			delete contentNodeSize.h;
			domGeom.setContentSize(this.containerNode, contentNodeSize);

			// get size of scrollbars (even if not desplayed)
			domStyle.set(this.containerNode, "overflow", "scroll");
			var mBox = domGeom.getMarginBox(this.containerNode);
			var cBox = domGeom.getContentBox(this.containerNode);
			domStyle.set(this.containerNode, "overflow", "auto");
			var hScrollBarH = mBox.h - cBox.h;
			var vScrollBarW = mBox.w - cBox.w;

			// get container node padding
			var padExtents = domGeom.getPadExtents(this.containerNode);

			var containerNodeSize = lang.clone(this.contentSize);
			containerNodeSize.w += padExtents.w + vScrollBarW;
			containerNodeSize.h += padExtents.h + hScrollBarH;
			domGeom.setContentSize(this.containerNode, containerNodeSize);
			return containerNodeSize;
		},

		resize : function() {
			var contentSize = this._contentSize();
			this.inherited(arguments, [
				contentSize
			]);
		}

	});
});