define([
	"require",
	"dojo/_base/declare",
	"dojo/dom-construct",
	"dojo/html",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"../encoders/html/encodeEntity",
	"./highlighter/shCore",
	"./highlighter/shBrushJScript",
	"./highlighter/shBrushXml",
	"./highlighter/shBrushCss",
	"./highlighter/shBrushJava",
	"dojo/text!./templates/Highlighter.html",
	"xstyle/css!./highlighter/styles/shCore.css",
	"xstyle/css!./highlighter/styles/shThemeDefault.css"
], function(require, declare, domConstruct, html, _WidgetBase, _TemplatedMixin, encodeEntity, shCore, shBrushJScript, shBrushXml, shBrushCss, shBrushJava,
		template) {

	var highlighter = shCore.SyntaxHighlighter;
	highlighter.defaults.toolbar = false;

	var brushMap = {
		js : shBrushJScript,
		xml : shBrushXml,
		css : shBrushCss,
		java : shBrushJava
	};

	return declare([
		_WidgetBase,
		_TemplatedMixin
	], {
		templateString : template,
		brush : 'js',
		content : null,

		startup : function() {
			this.inherited(arguments);
			if (this.content == null) {
				this.content = this.containerNode.innerHTML; /* git-qa */
			} else {
				html.set(this.containerNode, this.content);/* git-qa */
			}
			this._highlightContent();
		},

		_setBrushAttr : function(brush) {
			if (!(brush in brushMap)) {
				throw new Error("Unknown brush: " + brush);
			}
			this._set("brush", brush);
			if (this._started) {
				this._highlightContent();
			}
		},

		//DOES not work correctly in IE7/8, setting the content dynamicaly ignores "\r\n"
		_setContentAttr : function(content) {
			content = encodeEntity(content);
			this._set("content", content);
			if (this._started) {
				this._highlightContent();
			}
		},

		_highlightContent : function() {

			if (this._highlighted) {
				// need to reacreate containerNode because of destructive highligter behaviour
				domConstruct.empty(this.domNode);
				this.containerNode = domConstruct.create("pre", {
					innerHTML /* git-qa */: this.content
				}, this.domNode);
			}
			highlighter.highlight({
				brush : this.brush
			}, this.containerNode);
			this._highlighted = true;
		}
	});
});
