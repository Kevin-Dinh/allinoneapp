define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/on",
	"dojo/keys",
	"dijit/Tooltip",
	"put-selector/put",
	"dojo/i18n!./nls/EnhancedSort",
	"dojo/aspect",
	"dojo/_base/lang",
	"xstyle/css!./resources/dgrid-enhanced-sort.css"
], function(declare, array, listen, keys, Tooltip, put, i18n, aspect, lang) {

	// summary:
	//		Adds footer with button that removes (or reverts to default) sort 

	function getColumns(grid) {
		return grid.subRows && grid.subRows.length ? Array.prototype.concat.apply([], grid.subRows) : grid.columns;
	}
	
	function getColumnByField(grid, field) {
		var columns = getColumns(grid);
		for ( var c in columns) {
			if (columns[c].field === field) {
				return columns[c];
			}
		}
		return /*undefined*/;
	}

	return declare(null, {
		_removeSortFooter : null,

		showResetSort : false,

		buildRendering : function() {
			this.inherited(arguments);
			this._updateRemoveSortFooter();
			aspect.after(this, "updateSortArrow", lang.hitch(this, "_updateRemoveSortFooter"));
		},

		_updateRemoveSortFooter : function() {
			var grid = this;
			if (this.showResetSort) {
				this.set("showFooter", true); // show footer
				if (!this._removeSortFooter) {
					var sortFooterNode = put(this.footerNode, "div.dgrid-reset-footer");
					var resetLink = this._removeSortFooter = put(sortFooterNode, "span.ui-icon.dgrid-reset-sort");
					resetLink.setAttribute("aria-label", i18n.resetSort);
					resetLink.tabIndex = 0;

					listen(resetLink, "click,keydown", function(event) {
						// if grid is disabled do nothing
						if (grid.disabled) {
							return /*undefined*/;
						}

						if (event.type === "keydown" && event.keyCode !== keys.ENTER) {
							return;
						}
						var cls = this.className;
						if (cls.indexOf("dgrid-reset-sort-disabled") > -1) {
							return;
						}
						grid.removeSort();
					});

					var t = new Tooltip({
						label : i18n.resetSort
					});
					t.addTarget(resetLink);
				}
				var sorts = this.get("sort");
				// filter unsortable columns (prevent reset unsorted grids with default sort)
				var filteredSorts = array.filter(sorts, function(sort) {
					var attribute = sort && sort.attribute;
					if (grid._reverseRemapSort && grid._reverseRemapSort[attribute]) {
						// reverse remapped attributes
						attribute = grid._reverseRemapSort[attribute];
					}
					var column = getColumnByField(grid, attribute);
					return column && (column.sortable || (column.headerNode && column.headerNode.sortable));
				});
				// add/remove disabled class
				var disableRemoveSortBtn;
				if (this.defaultSort && this.defaultSort.length) {
					disableRemoveSortBtn = this.defaultSort.length == sorts.length//
							&& array.every(this.defaultSort, function(item, idx) {
								var otherItem = sorts[idx];
								var itemDescending = !!item.descending;
								var otherItemDescending = !!otherItem.descending;
								return (item.attribute == otherItem.attribute) && (itemDescending == otherItemDescending);
							});
				} else {
					disableRemoveSortBtn = !filteredSorts.length;
				}
				put(this._removeSortFooter, (disableRemoveSortBtn ? "." : "!") + "dgrid-reset-sort-disabled");
			}
		},

		defaultSort : null,

		removeSort : function(onlyReset) {
			// summary:
			//		Remove sort. If `onlyReset` is true, sort will be removed without requery.
			if (onlyReset) {
				this.updateSortArrow([], true);
			} else {
				this.set("sort", this.defaultSort || []); //causes requery
			}
		}

	});
});