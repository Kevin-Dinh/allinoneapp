/**
 * widget			Link
 * created			05/17/2012
 * @author	 		jukrop
 * @description		
 */

define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_CssStateMixin",
	"./_LinkWidget",
	"dijit/form/_FormWidgetMixin",
	"dojo/dom-attr",
	"dojo/html",
	"gjax/encoders/html/encodeSmp"
], function(declare, _Widget, _TemplatedMixin, _CssStateMixin, _LinkWidget, _FormWidgetMixin, domAttr, html, encHtml) {

	// module:
	//		gjax/tdi/Link
	// summary:
	//		Basic `<a>` element with TDI functionality.
	return declare([
		_Widget,
		_TemplatedMixin,
		_CssStateMixin,
		_FormWidgetMixin,
		_LinkWidget
	], {
		// summary:
		//		Basic `<a>` element with TDI functionality.
		// description:
		//		Used to replace `<a>` elements to enable TDI.
		// example:
		//		Programatic creation:
		//	|	var linkWidget = new Link({
		//	|		label : i18n.get("labProgramatic"),
		//	|		href : "gjax-wnd-tdi/child-a", // href is required
		//	|		defaultOption : "newWin",
		//	|		enabledOptions : [], // "none"
		//	|		// static parameters example
		//	|		vArguments : {
		//	|			ssn : 'ssn parameter',
		//	|			someArray : [
		//	|				'1',
		//	|				'2',
		//	|				'3'
		//	|			],
		//	|			loadTile : new Date()
		//	|		},
		//	|		features : "menubar=yes,location=yes,status=yes",
		//	|		callback : sampleCallback	// function
		//	|	}, "linkDiv");
		//	|	linkWidget.startup();
		// example:
		//		Arguments can be calculated programatically on link click, just set it as function
		//	|	link.set("vArguments", function() {
		//	|		return {	// return value will be used as arguments
		//	|			ssn : 'ssn parameter',
		//	|			someArray : [
		//	|				'1',
		//	|				'2',
		//	|				'3'
		//	|			],
		//	|			clickTime : new Date()
		//	|		};
		//	|	});
		//		The `href` property can be set in the same way.

		templateString : '<a href="${href}" data-dojo-attach-point="hrefNode,linkNode,containerNode,focusNode"></a>',

		baseClass : "gjaxLink",

		buildRendering : function() {
			this.inherited(arguments);
			this.dropDown.bindDomNode(this.linkNode);
		},

		_setDisabledAttr : function() {
			this.inherited(arguments);
			//remove 'disabled' attribute, it does not exists on A element, and causes strange look in IE
			domAttr.remove(this.focusNode, "disabled");
		},

		destroy : function() {
			this.dropDown.unBindDomNode(this.linkNode);
			this.inherited(arguments);
		},

		_fillContent : function(/*DomNode*/source) {
			var dest = this.containerNode;
			if (this.label) {
				html.set(dest, encHtml(this.label));
			} else if (source) {
				while (source.hasChildNodes()) {
					dest.appendChild(source.firstChild);
				}
			}
		},

		_setLabelAttr : function(label) {
			this._set("label", label);
			html.set(this.containerNode, encHtml(label));
		}
	});
});