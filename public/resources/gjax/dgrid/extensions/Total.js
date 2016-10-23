/**
 * author: arakovsky
 * 
 * */

define([
	"dojo/_base/declare",
	"dojo/i18n!./nls/Total",
	"dojo/dom-construct",
	"dojo/html",
	"dojo/when",
	"dojo/aspect",
	"gjax/encoders/html/encodeSmp",
	"dojo/_base/lang",
	"dojox/lang/functional",
	"xstyle/css!./resources/dgrid-total.css"
], function(declare, i18n, domConstruct, html, when, aspect, encHtml, lang, df) {
	return declare(null, {
		// summary:
		//		Displays totol record count. Use with onDemandGrid with virtual scrolling

		showFooter : true, //must be true set to true (dgrid property)

		showSelectedCount : false,

		buildRendering : function() {
			this.inherited(arguments);
			var totalNode = this._totalNode = this._createTotalNode();
			var totalTextNode = this._totalTextNode = this._createTotalTextNode(totalNode);
			var totalSelectedNode = this._totalSelectedNode = this._createTotalSelectedNode(totalNode);
			this.on("dgrid-refresh-complete", lang.hitch(this, "_hRefreshComplete", totalTextNode));
			this.on("dgrid-select,dgrid-deselect", lang.hitch(this, "_hSelectionChange", totalSelectedNode));
			this.own(aspect.after(this, "refresh", lang.hitch(this, "_hRefresh", totalTextNode, totalSelectedNode)));
		},

		toggleShowTotalSelected : function(show) {
			if (show == null) {
				show = !this.showSelectedCount;
			}
			this.showSelectedCount = show;
			this._hSelectionChange(this._totalSelectedNode);
		},

		_hRefreshComplete : function(totalNode, evt) {
			var results = evt.results;
			when(results.total).then(function(total) {
				html.set(totalNode, encHtml(i18n.recordCount + " " + (total || "0")));
			});
			this._hSelectionChange(this._totalSelectedNode);
		},

		_hSelectionChange : function(totalSelectedNode) {
			if (this.showSelectedCount && this._totalTextNode.innerHTML) {//display only when also total is displayed
				var selectedCount = this.selection && df.keys(df.filterIn(this.selection, "val")).length;
				html.set(totalSelectedNode, encHtml(i18n.selectedCount + " " + (selectedCount || "0")));
			} else {
				html.set(totalSelectedNode, ""); /* git-qa */
			}
		},

		_hRefresh : function(totalNode, totalSelectedNode) {
			html.set(totalNode, ""); /* git-qa */
			html.set(totalSelectedNode, ""); /* git-qa */
		},

		_createTotalNode : function() {
			return domConstruct.create("div", {
				"class" : "gjax-dgrid-total"
			}, this.footerNode);
		},

		_createTotalTextNode : function(node) {
			return domConstruct.create("div", {
				"class" : "gjax-dgrid-total-text"
			}, node);
		},

		_createTotalSelectedNode : function(node) {
			return domConstruct.create("div", {
				"class" : "gjax-dgrid-total-selected"
			}, node);
		}
	});
});