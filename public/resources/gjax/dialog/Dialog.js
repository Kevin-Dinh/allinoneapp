define([
	"dojo/_base/declare",
	"dijit/Dialog",
	"dijit/_WidgetsInTemplateMixin",
	"gjax/dialog/_DialogSizingMixin",
	"dojo/text!./templates/Dialog.html",
	"dojo/dom-class",
	"dojo/html",
	"dojo/i18n!./nls/Dialog",
	"dojo/_base/lang",
	"dojo/_base/event",
	"dojo/on",
	"gjax/_base/dom",
	"dojo/_base/array",
	"dojo/window",
	"dojo/dom-geometry",
	"dojo/has",
	"gjax/encoders/html/encodeSmp",
	"dojo/dom-style",
	"dojo/keys",
	"dijit/TooltipDialog",
	"dijit/popup",
	//
	"dijit/form/Button",
	"dojo/sniff"
], function(declare, Dialog, _WidgetsInTemplateMixin, _DialogSizingMixin, templateString, domClass, html, messages, lang, event, on, gDom, array, winUtils, domGeom, has, encHtml,
		domStyle, keys, TooltipDialog, popup) {

	var showedStack = [];

	return declare([
		Dialog,
		_WidgetsInTemplateMixin,
		_DialogSizingMixin
	], {

		baseClass : "gjaxDialog",
		contentTemplateString : templateString,
		//no animation
		duration : 0,
		
		defaultAction : null,

		_messages : messages,

		/*=== display of buttons ===*/
		okBtnDisplayed : true,
		_setOkBtnDisplayedAttr : function(okBtnDisplayed) {
			this._set("okBtnDisplayed", okBtnDisplayed);
			this.btnOk.set("hidden", !okBtnDisplayed);
		},

		cancelBtnDisplayed : false,
		_setCancelBtnDisplayedAttr : function(cancelBtnDisplayed) {
			this._set("cancelBtnDisplayed", cancelBtnDisplayed);
			this.btnCancel.set("hidden", !cancelBtnDisplayed);
		},

		yesBtnDisplayed : false,
		_setYesBtnDisplayedAttr : function(yesBtnDisplayed) {
			this._set("yesBtnDisplayed", yesBtnDisplayed);
			this.btnYes.set("hidden", !yesBtnDisplayed);
		},

		noBtnDisplayed : false,
		_setNoBtnDisplayedAttr : function(noBtnDisplayed) {
			this._set("noBtnDisplayed", noBtnDisplayed);
			this.btnNo.set("hidden", !noBtnDisplayed);
		},

		/*=== return val of buttons ===*/
		okBtnReturnVal : true,

		cancelBtnReturnVal : false,

		yesBtnReturnVal : true,

		noBtnReturnVal : false,

		/*=== return val of closing via ESCAPE ===*/
		closeReturnVal : null,

		/*=== labels of buttons ===*/
		bugReportBtnLabel : messages.btnBugReport,
		_setBugReportBtnLabelAttr : function(bugReportBtnLabel) {
			this._set("bugReportBtnLabel", bugReportBtnLabel);
			this.btnBugReport.set("label", bugReportBtnLabel);
			html.set(this.bugReportLegend, encHtml(bugReportBtnLabel));
		},

		okBtnLabel : messages.btnOk,
		_setOkBtnLabelAttr : function(okBtnLabel) {
			this._set("okBtnLabel", okBtnLabel);
			this.btnOk.set("label", okBtnLabel);
		},

		cancelBtnLabel : messages.btnCancel,
		_setCancelBtnLabelAttr : function(cancelBtnLabel) {
			this._set("cancelBtnLabel", cancelBtnLabel);
			this.btnCancel.set("label", cancelBtnLabel);
		},

		yesBtnLabel : messages.btnYes,
		_setYesBtnLabelAttr : function(yesBtnLabel) {
			this._set("yesBtnLabel", yesBtnLabel);
			this.btnYes.set("label", yesBtnLabel);
		},

		noBtnLabel : messages.btnNo,
		_setNoBtnLabelAttr : function(noBtnLabel) {
			this._set("noBtnLabel", noBtnLabel);
			this.btnNo.set("label", noBtnLabel);
		},

		/*=== message, type, report ===*/
		message : "",
		_setMessageAttr : function(messageHTML) {
			this._set("message", messageHTML);
			html.set(this.contentSpan, messageHTML);/* git-qa */
		},

		bugReport : null,
		_setBugReportAttr : function(bugReportHTML) {
			this._set("bugReport", bugReportHTML);
			html.set(this.bugReportPre, bugReportHTML);/* git-qa */
			this.btnBugReport.set("hidden", !(bugReportHTML && bugReportHTML.length));
		},

		type : "info",
		_setTypeAttr : function(type) {
			this._set("type", type);
			domClass.add(this.domNode, type);
		},

		_setClosableAttr : function(closable) {
			this.inherited(arguments);
			domClass.toggle(this.titleBar, "gjaxDialogTitleBarClosable", closable);
		},

		buildRendering : function() {
			this.templateString = this.templateString.replace('<div data-dojo-attach-point="containerNode" class="dijitDialogPaneContent"></div>',
					'<div data-dojo-attach-point="containerNode" class="dijitDialogPaneContent">' + this.contentTemplateString + '</div>');
			this.inherited(arguments);

			//Setter must be called explicitely. Setting the value on prototype would not work, because setter is not called for falsy values
			this.set("closable", false);
		},

		_onKey : function(/*Event*/evt) {
			// summary:
			//		Handles closing via ESCAPE.
			// tags:
			//		private

			this.inherited(arguments);
			if (evt.keyCode == keys.ESCAPE) {
				this._closeWithValue(this.closeReturnVal);
				evt.stopPropagation();
				evt.preventDefault();
			}
		},

		hide : function() {
			var showedPosition = array.indexOf(showedStack, this);
			if (showedPosition != -1) {
				showedStack.splice(showedPosition, 1);
			}
			this.inherited(arguments);
		},

		destroy : function() {
			var showedPosition = array.indexOf(showedStack, this);
			if (showedPosition != -1) {
				showedStack.splice(showedPosition, 1);
			}
			this.inherited(arguments);
		},

		show : function() {
			if (~array.indexOf(showedStack, this)) {
				return;//throw new Error("Dialog is already showed.");
			}
			this.inherited(arguments);
			if (showedStack.length > 0) {
				this._positionWithinCurrent(showedStack[showedStack.length - 1]);
			}
			showedStack.push(this);

			domStyle.set(this.domNode, "zIndex", domStyle.get(this.domNode, "zIndex") + 10000); //to display over StandBy
			
			if (this.defaultAction && this["btn" + this.defaultAction]) {
				this["btn" + this.defaultAction].focus();
			}
		},

		_positionWithinCurrent : function(currentDialog) {
			var viewport = winUtils.getBox();
			var bodySize = domGeom.getMarginBox(document.body); 
			
			var currentNodePosition = domGeom.position(currentDialog.domNode);
			var nodePosition = domGeom.position(this.domNode);
			nodePosition.y = currentNodePosition.y + 10;
			nodePosition.x = currentNodePosition.x + 10;

			if ((nodePosition.x + nodePosition.w) > Math.max(viewport.w,bodySize.w) || (nodePosition.y + nodePosition.h) > Math.max(viewport.h, bodySize.h)) {
				delete this._relativePosition;
			} else {
				this._relativePosition = nodePosition;
			}
			this._position();
		},

		startup : function() {
			this.inherited(arguments);

			this.btnYes.on("click", lang.hitch(this, "_closeWithValue", this.yesBtnReturnVal));
			this.btnNo.on("click", lang.hitch(this, "_closeWithValue", this.noBtnReturnVal));
			this.btnOk.on("click", lang.hitch(this, "_closeWithValue", this.okBtnReturnVal));
			this.btnCancel.on("click", lang.hitch(this, "_closeWithValue", this.cancelBtnReturnVal));

			//select all report text on dbl click
			this.own(on(this.bugReportPre, "dblclick", lang.partial(function(preNode, e) {
				event.stop(e);
				gDom.selectElement(preNode);
			}, this.bugReportPre)));

			if (has("trident")) {
				// copy to clipboard is available only in IE
				var copyOkMsgDialog = new TooltipDialog({
					content : messages.msgCopyOk
				});
				this.btnCopy.on("click", lang.hitch(this, function() {
					// copy
					window.clipboardData.setData("Text", gDom.getText(this.bugReportPre));
					// show confirmation
					popup.open({
						popup : copyOkMsgDialog,
						parent : this.btnCopy,
						around : this.btnCopy.domNode,
						orient : [
							"above"
						]
					});
					// TODO: investicate this, why is popup behind dialog? bug of dojo?
					domStyle.set(copyOkMsgDialog._popupWrapper, "zIndex", domStyle.get(this.domNode, "zIndex") + 100);
					// hide confirmation after 1 sec
					setTimeout(lang.hitch(popup, "close", copyOkMsgDialog), 1000);
				}));
			} else {
				this.btnCopy.hide();
			}
		},

		_toggleReport : function() {
			domClass.toggle(this.bugReportDiv, "gjaxHidden");
		},

		_closeWithValue : function(val) {
			this.hide();
			this.onClose(val);
		},

		onClose : function(/*===== value =====*/) {
			// summary:
			//		Connect to this function to receive notification when the dialog is closed.
			// value: Boolean
			//		Value that this dialog was closed with (OK, YES: true; CANCEL, NO: false)
		}
	});
});
