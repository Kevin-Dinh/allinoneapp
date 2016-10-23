/**
 * created 06/18/2015
 * @author arakovsky
 */

define([
	"dojo/_base/declare"
], function(declare) {
	return declare(null, {
		// summary:
		//		Mixin that ensures that enable redefine sortAttr per column
		// description:
		//		This mixins allows to have different attribute (from "field") that will be used to cort given column 
		startup : function() {
			if (this._started) {
				return;
			}
			this.inherited(arguments);
			this.on("dgrid-sort", function(evt) {
				var target = evt.target, headerNode = evt.grid.headerNode, sort, grid = evt.grid, newSort;
				do {
					if (target.sortable) {
						var col = evt.grid.column(target);
						if (col && col.sortAttr && (newSort = evt.sort && evt.sort[0])) {
							newSort.attribute = col.sortAttr;
							newSort.descending = (sort = grid._sort[0]) && sort.attribute == newSort.attribute && !sort.descending;
						}
						break;
					}
				} while ((target = target.parentNode) && target != headerNode);
				return true;
			});
		},
		_findSortArrowParent : function(field) {
			// summary:
			//		Method responsible for finding cell that sort arrow should be
			//		added under.  Called by updateSortArrow; separated for extensibility.

			var columns = this.columns;
			for ( var i in columns) {
				var column = columns[i];
				if (column.field == field || column.sortAttr == field) {
					return column.headerNode;
				}
			}
		}
	});
});