/**
 * widget			LinkButton
 * created			05/17/2012
 * @author	 		jukrop
 * @description		
 */

define([
	"dojo/_base/declare",
	"dojo/mouse",
	"./_LinkWidget",
	"dijit/form/Button",
	"dojo/text!./templates/Button.html",
	"dojo/_base/array"
], function(declare, mouse, _LinkWidget, Button, template, array) {

	// module:
	//		gjax/tdi/LinkButton
	// summary:
	//		Button widget with TDI functionality.
	return declare([
		Button,
		_LinkWidget
	], {
		// summary:
		//		Button widget with TDI functionality.
		// description:
		//		Has TDI menu in context (right-click) menu.
		// example:
		//		Programatic creation:
		//	|	var linkBtnWidget = new LinkButton({
		//	|		label : i18n.get("labControlable"),
		//	|		href : "gjax-wnd-tdi/child-a", // required
		//	|		// dynamic parameters example - resolved on link click
		//	|		vArguments : function() {
		//	|			return {
		//	|				ssn : 'ssn parameter',
		//	|				someArray : [
		//	|					'1',
		//	|					'2',
		//	|					'3'
		//	|				],
		//	|				clickTime : new Date()
		//	|			};
		//	|		},
		//	|		callback : sampleCallback
		//	|	}, "linkBtnDiv");
		//	|	linkBtnWidget.startup();

		baseClass : "dijitButton gjaxLinkButton",

		templateString : template,

		buildRendering : function() {
			this.inherited(arguments);
			this.dropDown.bindDomNode(this.domNode);
		},

		destroy : function() {
			this.dropDown.unBindDomNode(this.domNode);
			this.inherited(arguments);
		},

		_tmpButton : null,

		openDefault : function(e) {
			// summary:
			//		Navigate using default TDI option set for this widget.
			// returns: Window
			//		Opened window
			var fakeEvent = {
				button : this._tmpButton // use stored button (always 0 in event from button)
			};
			var tabAllowed = ~array.indexOf(this.get("enabledOptions"), "new");
			var option = fakeEvent.button != null && mouse.isMiddle(fakeEvent) && tabAllowed ? "new" : this.get("defaultOption");
			return this.open(option, e);
		},

		__onClick : function(/*Event*/e) {
			// original event button will be lost in button code (see __onClick vs _onClick in _ButtonMixin)
			this._tmpButton = e && e.button;
			this.inherited(arguments);
		}

	});
});