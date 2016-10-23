/**
 * widget			LinkComboButton
 * created			05/17/2012
 * @author	 		jukrop
 * @description		
 */

define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/dom-construct",
	"./_LinkWidget",
	"dijit/form/ComboButton"
], function(declare, lang, domClass, domConstruct, _LinkWidget, ComboButton) {
	
	// module:
	//		gjax/tdi/LinkComboButton
	// summary:
	//		ComboButton widget with TDI functionality.
	return declare([
		ComboButton,
		_LinkWidget
	], {
		// summary:
		//		ComboButton widget with TDI functionality.
		// description:
		//		Has TDI menu in dropdown. Dropdown is hidden when no options are enabled.
		// example:
		//		Programatic creation:
		//	|	var linkComboBtnWidget = new LinkComboButton({
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
		//	|	linkComboBtnWidget.startup();
		
		baseClass : "dijitComboButton gjaxLinkButton gjaxLinkComboButton",
		
		_beforeFillContent : function() {
			// move label text to span - _fillContent expects label in its own element
			var source = this.srcNodeRef;
			if(source && source.hasChildNodes()) {
				var span = domConstruct.create("span", {}, source, "last");
				span.appendChild(source.firstChild);
			}
		},

		hideDropDown : function(hide) {
			this.inherited(arguments);
			// hide dropdown button when all options are disabled and hidden
			this._hideNode(this._buttonNode, hide);
			// make rounded corners if dropDown arrow is hidden on button right side
			if (hide) {
				domClass.add(this.buttonNode, "dijitLinkComboButtonArrowHidden");				
			} else {
				domClass.remove(this.buttonNode, "dijitLinkComboButtonArrowHidden");				
			}
		},
		
		_updateMenu : function() {
			this.hideDropDown(!this.get("enabledOptions").length && this.get("hideDisabled"));			
		},

		startup : function() {
			if (this._started) {
				return;				
			}
			this.inherited(arguments);

			this.on("menuModified", lang.hitch(this, "_updateMenu"));
		}

	});
});