/**
 * widget TemplatedDialog created 10/08/2012
 * 
 * @author pkrajnik
 * @description
 */

define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dijit/Dialog",
	"dojo/on",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/Deferred",
	"gjax/_ViewMixin",
	"gjax/_MessagePaneMixin",
	"./_DialogSizingMixin",
	"dojo/dom-geometry",
	"dojo/dom-construct",
	"dojo/dom-style",
	"gjax/message/MessagePane",
	"dojo/aspect",
	"dojo/dom-class",
	"dojox/layout/ResizeHandle",
	"gjax/error"
], function(declare, lang, Dialog, on, _WidgetsInTemplateMixin, Deferred, _ViewMixin, _MessagePaneMixin, _DialogSizingMixin, domGeom, domConstruct, domStyle,
		MessagePane, aspect, domClass, ResizeHandle, error) {
	return declare([
		Dialog,
		_WidgetsInTemplateMixin,//Dialog by default does not mixin in this, we can safely mix it now, it does not override any methods
		_ViewMixin,
		_MessagePaneMixin,
		_DialogSizingMixin
	], {// summary:
		// 		Base class for templated dialogs
		//
		// description:
		// 		Widget that provide base class for dialogs with HTML template. TemplatedDialog extends `dijit/Dialog`.
		// example:
		//		| var dialog = declare([
		//      | 	TemplatedDialog
		//      | ], {
		//      |	//assign template loaded using dojo/text plugin that will be used as dialog content
		//      |   contentTemplateString : formTemplate,
		//      |      		
		//      |
		//      | 	//set title of the dialof
		//      |   title : i18n.get("myDialogTitle"),
		//      |        		
		//      |   //specifies, that one instance of dialog may be reopened more times
		//      |   reusable : true,
		//      |        		
		//      |   //define size of dialog (defined by content, real size of dialog is adjusted by surrounding elements)
		//      |   contentSize:{
		//      |      	w:400,
		//      |   	h:300
		//      |   },
		//      |        		
		//      |   //method that is automatically called on every open, 
		//      |   resetDialog : function() {
		//      |   	//user may have selected something in the grid, so clear selection on reopen
		//      |       this.sameSSNGrid.selection.clear();
		//      |   },
		//      |        	
		//		|	startup : function() {
		//      |		this.inherited(arguments);
		//      |		this._initGrid();
		//      |		this._closeDeferredValue = "ahoj";
		//      |	}
		//		| });

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

		// resizable: Boolean
		//		Allow resizing of pane true if true
		//		Css must be imported: dojox/layout/resources/ResizeHandle.css
		resizable : false,

		// minSize: Object
		//		Attribute passed to ResizeHandle	
		minSize : null,
		// maxSize: Object
		//		Attribute passed to ResizeHandle	
		maxSize : null,

		// _isUserSized: Boolean
		//		Flag used to prevent auto sizing when reopening dialog, that was sized by user
		_isUserSized : false,

		// resizeAxis: String
		//		One of: x | xy | y to limit pane's sizing direction
		resizeAxis : "xy",

		// modeless: Boolean
		//		When true, this dialog will not show underlay preventing interaction with background/parent
		modeless : false,

		constructor : function() {
			this.baseClass += " templatedDialog";
		},

		postMixInProperties : function() {
			//this is to prevent situation when srcNodeRef was set when creating widget programmatically

			if (this.params && this.params.content) {
				delete this.params.content;
			}
			if (this.content) {
				delete this.content;
			}
			this.inherited(arguments);
		},

		buildRendering : function() {
			//Add content template inside original dialog template

			// $ is special character in 'newSubStr' argument of replace, so replace it before using by '$$' ($$$$ to really insert '$$')
			var contentTemplateString = this.contentTemplateString.replace(/\$/g, "$$$$");
			this.templateString = this.templateString.replace('<div data-dojo-attach-point="containerNode" class="dijitDialogPaneContent"></div>',
					'<div data-dojo-attach-point="containerNode" class="dijitDialogPaneContent">' + contentTemplateString + '</div>');
			this.inherited(arguments);
			this.containerWrapperNode = domConstruct.create("div", {
				className : "templatedDialogContainerWrapper"
			}, this.domNode);
			domConstruct.place(this.containerNode, this.containerWrapperNode);
			this.messagePaneRef = new MessagePane({});
			this.messagePaneRef.placeAt(this.containerNode, "first");
			this.messagePaneRef.startup();
			this.own(this.messagePaneRef);

			if (this.closable) {
				domClass.add(this.titleBar, "gjaxDialogTitleBarClosable");
			}

			if (this.resizable) {
				var rh = this._resizeHandle = new ResizeHandle({
					targetId : this.id,
					resizeAxis : this.resizeAxis,
					minSize : this.minSize,
					maxSize : this.maxSize
				});

				rh.placeAt(this.domNode);
				this.own(rh);

			}
		},

		postCreate : function() {
			this.inherited(arguments);
			//destroy the dialog on close if it is not reusable
			if (!this.reusable) {
				var _this = this;
				this.on("hide", function() {
					setTimeout(lang.hitch(_this, "destroyRecursive"), _this.duration);
				});
			}
			this.on("hide", lang.hitch(this, "_resolveDeferred"));

			// JU: overriden to deliberately to get rid of aspects bound to onCancel
			this.onCancel = function() {
			};

			// original aspect in dijit/Dialog.postCreate was lost onCancel method was overriden
			this.own(//MR: keep handler to be destroyed properly
			aspect.after(this, "onCancel", lang.hitch(this, function() {
				if (!this.disabled) {
					this.hide();
				}
			}), true)//
			);
		},

		startup : function() {
			if (this._started) {
				return;
			}
			this.inherited(arguments);
			if (this._resizeHandle) {
				this._resizeHandle.startup();
			}

			if (this.modeless) {
				this["class"] = (this["class"] || "") + " modeless"; // will create "modeless_underlay" class on underlay
			}
		},

		show : function() {
			// summary:
			//           Opens the dialog

			if (this._destroyed) {
				throw error.newError(new Error(), "Trying to open destroyed dialog (possibly reopen of non reusable dialog).", null,
						"gjax/dialog/TemplatedDialog");
			}

			//call mathod that may clear the dialog
			this.resetDialog();
			//inherited returns promise (animation of show)
			var showDeferred = this.inherited(arguments);

			// prepare returned deferred - resolves on close & has showDeferred as property
			var retDfd = new Deferred();
			showDeferred.then(lang.hitch(this, function() {
				//create new instance of _closeDeferred
				this._closeDeferred = new Deferred();
				this._closeDeferredValue = null;
				//call resize so child widget will get sized
				this.resize();
				this._closeDeferred.then(lang.hitch(retDfd, "resolve"), lang.hitch(retDfd, "reject"));
			}));
			retDfd.showDeferred = showDeferred;

			return retDfd;
		},

		close : function(value) {
			// summary:
			//		Convinient mathod that can be called to close the dialog and set value for _closeDeferred.
			// value:
			//		Object that this.closeDeffered will be resolved with
			this._closeDeferredValue = value;
			this.hide();
		},

		_resolveDeferred : function() {
			//deferred is resolved with value of _closeDeferredValue, which is undefined by default
			//but may be set anytime during the dialog is shown
			this._closeDeferred.resolve(this._closeDeferredValue);
		},

		resize : function(dim) {
			// summary:
			//		Sets the size of the dialog and layouts child widgets

			// AR: this is a hack for wrong chrome behaviour for nodes with auto margin a scroll auto
			// situation where left scrollbar is need only because there is bottom scrollbar and vice versa
			domStyle.set(this.containerNode, "margin", "0");

			this._contentSize();
			this.inherited(arguments);
			this._layoutChildren();

			// AR: return original margin
			domStyle.set(this.containerNode, "margin", "0 auto");

			if (dim && this.resizable && this.reusable) {
				this._isUserSized = true;
			}
		},

		resetDialog : function() {
			// summary:
			//		Method that is called on each dialog open. It should be used to clear the dialog state before reopening.
			// tags:
			//		protected
		},

		_onShow : function() {
			this._wasShown = true;

			//AR commented out original code to prevent calling resize on children before dialog gets visible:
			/*if(this._needLayout){
				// If a layout has been scheduled for when we become visible, do it now
				this._layout(this._changeSize, this._resultSize);
			}*/

			this.onShow(); //from: this.inherited(arguments);
		},

		_contentSize : function() {
			// summary:
			//		Set dialog size according to contentSize attribute
			// tags:
			//		private

			if (this._isUserSized) {
				return;
			}

			//set size of container node
			var contentNodeSize = lang.clone(this.contentSize);
			delete contentNodeSize.h;
			domGeom.setContentSize(this.containerNode, contentNodeSize);

			//get size of scrollbars (even if not desplayed)
			domStyle.set(this.containerWrapperNode, "overflow", "scroll");
			var mBox = domGeom.getMarginBox(this.containerWrapperNode);
			var cBox = domGeom.getContentBox(this.containerWrapperNode);
			domStyle.set(this.containerWrapperNode, "overflow", "auto");
			var hScrollBarH = mBox.h - cBox.h;
			var vScrollBarW = mBox.w - cBox.w;

			//get container node padding
			var padExtents = domGeom.getPadExtents(this.containerNode);

			var containerWrapperNodeSize = lang.clone(this.contentSize);
			containerWrapperNodeSize.w += padExtents.w + vScrollBarW;
			containerWrapperNodeSize.h += padExtents.h + hScrollBarH;

			var ss = this._getScreenSize();
			var usableScreenHeight = Math.floor(ss.h * this.maxRatio);
			var usableScreenWidth = Math.floor(ss.w * this.maxRatio);
			var titleMarginBox = domGeom.getMarginBox(this.titleBar);
			var dialogPadBorderExt = domGeom.getPadBorderExtents(this.domNode);

			// AR: if dialog would not fit in screen, shring the contentSize.h
			// this is solution to the BUG which causes not displaying title in Chrome
			// This will prevent 'shrunk' logic (see _DialogSizingMixin)
			// -1 because of >= in comparison (the equal part)
			containerWrapperNodeSize.h = Math.min(containerWrapperNodeSize.h, usableScreenHeight - titleMarginBox.h - dialogPadBorderExt.h - 1);
			containerWrapperNodeSize.w = Math.min(containerWrapperNodeSize.w, usableScreenWidth - dialogPadBorderExt.w - 1);

			domGeom.setContentSize(this.containerWrapperNode, containerWrapperNodeSize);
		}
	});
});