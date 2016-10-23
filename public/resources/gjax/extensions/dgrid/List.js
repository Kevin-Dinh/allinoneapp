/*jshint unused:false*/
define([
	"dojo/aspect",
	"dojo/_base/lang",
	"dgrid/List",
	"put-selector/put",
	"gjax/log/level",
	"dojo/dom-geometry",
	"dojo/dom-style",
	"dojo/when"
], function(aspect, lang, List, put, level, domGeom, domStyle, when) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: highlight row method and default css class for dgrid");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: cleanEmptyObservers is now by default false");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: added property keepHeightOnReload");

	var origCleanup = List.prototype.cleanup;
	var origRenderArray = List.prototype.renderArray;

	List.extend({

		//AR: see email communication 'dgrid & Cache & Observable & no data', 01/2016
		cleanEmptyObservers : false,

		//PK: set to false to turn off highlighting
		highlightRowClass : "dgrid-row-highlighted",

		//PK: put highlight class to target row
		//target : get the row object by id, object, node, or event
		//cssClass : cusstom css class, default is highlightRowClass : dgrid-row-highlighted
		highlightRow : function(target, cssClass) {
			//cancel highlight
			this.clearHighlight();

			var cls = cssClass || this.highlightRowClass;
			if (target && cls) {
				var row = this.row(target);
				if (row && row.element) {
					put(row.element, "." + cls);
				}
				this._highlightedRow = {
					id : row.id,
					className : cls
				};
			}
		},

		//PK: remove highlight class from last highlighted row
		clearHighlight : function() {
			if (this._highlightedRow) {
				var oldRow = this.row(this._highlightedRow.id);
				if (oldRow && oldRow.element) {
					put(oldRow.element, "!" + this._highlightedRow.className);
				}
				this._highlightedRow = null;
			}
		},

		//AR: fixes height on reload
		// when grid has autoheight, page scroll is moved, because in certain time, grid has small height (without rows)
		keepHeightOnReload : false,
		cleanup : function() {
			if (this.keepHeightOnReload) {
				var h = domGeom.getContentBox(this.bodyNode).h;
				domStyle.set(this.bodyNode, "minHeight", h + "px"); //use minheight, so e.g. loading node will expand it for initial loadin
			}
			origCleanup.apply(this, arguments);
		},
		renderArray : function() {
			var rows = origRenderArray.apply(this, arguments);
			if (this.keepHeightOnReload) {
				var bodyNode = this.bodyNode;
				when(rows)//
				.then(function() {
					setTimeout(function() { //setTimeout to let the rows be rendered
						domStyle.set(bodyNode, "minHeight", "auto");
					}, 0);
				});
			}
			return rows;
		}
	});

	//PK: highlight row after insert to the list (provide correct highlighting after refresh, sort or scroll out) 
	aspect.around(List.prototype, "insertRow", function(origInsertRow) {
		return function(object, parent, beforeNode, i, options) {
			var row = lang.hitch(this, origInsertRow)(object, parent, beforeNode, i, options);
			if (this._highlightedRow && this._highlightedRow.id == this.store.getIdentity(object)) {
				put(row, "." + this._highlightedRow.className);
			}
			return row;
		};
	});
});