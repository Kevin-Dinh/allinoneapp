define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/on",
	"dojo/has",
	"put-selector/put",
	"./RemoveSort",
	"dojo/dom-class"

], function(declare, array, listen, has, put, RemoveSort, domClass) {
	// summary:
	//		Adds support for multiSort, reset sort button

//	var contentBoxSizing = has("ie") < 8 && !has("quirks");
//	function appendIfNode(parent, subNode) {
//		if (subNode && subNode.nodeType) {
//			parent.appendChild(subNode);
//		}
//	}

	function getColumns(grid) {
		return grid.subRows && grid.subRows.length ? Array.prototype.concat.apply([], grid.subRows) : grid.columns;
	}

	return declare(RemoveSort, {
		_lastSortedArrows : null, // array of nodes with sort arrow

		multiSort : false,

		buildRendering : function() {
			this.inherited(arguments);
			this._updateRemoveSortFooter();
		},

		// remapSort: Object?
		//		Explicitly remaps column sort to use another field for sorting.
		remapSort : null,

		// _reverseRemapSort: [private] Object?
		//		Convenient reversed map of remapSort
		_reverseRemapSort : null,

		renderHeader : function() {
			// summary:
			//		override listening to handle 3 state sorting

			var grid = this,
			// columns = this.columns, 
			headerNode = this.headerNode;

			this.inherited(arguments);

			// If the columns are sortable, re-sort on clicks.
			// Use a separate listener property to be managed by renderHeader in case
			// of subsequent calls.
			if (this._sortListener) {
				this._sortListener.remove();
			}
			var remapSort = this.remapSort = this.remapSort || {};
			this._reverseRemapSort = {};
			for ( var col in remapSort) {
				this._reverseRemapSort[remapSort[col]] = col;
			}

			this._sortListener = listen(this.headerNode, "table.dgrid-row-table:click,table.dgrid-row-table:keydown", function(event) {
				if (grid.disabled) {
					return /*undefined*/;
				}
				// respond to click, space keypress, or enter keypress
				if (event.type == "click" || event.keyCode == 32 /* space bar */|| (!has("opera") && event.keyCode == 13) /* enter */) {
					var target = event.target, field, sort, newSort, oldSort, eventObj;
					do {
						if (domClass.contains(target, "dgrid-filter")) {
							// ignore events on filter widget
							break;
						}
						if (target.sortable) {
							// If the click is on the same column as the active sort,
							// reverse sort direction

							// get old query and create copy (dont modify instance)
							oldSort = grid.get("sort").slice();

							field = target.field || target.columnId;
							field = remapSort[field] || field;
							newSort = {
								attribute : field,
								descending : (sort = grid._sort[0]) && sort.attribute == field && !sort.descending
							};

							var id, // id of sorting options
							index, length, // length of old sort
							notFound = true, // if new sort is in oldSort 
							_sortOpt = [
								false,
								true,
								"none"
							]; //sorting options

							// try to find new sort field in current (old) sort, if found, update sort options (false, true, none)
							for (index = 0, length = oldSort.length; index < length && notFound; index++) {
								if (oldSort[index].attribute === newSort.attribute) {
									id = array.indexOf(_sortOpt, oldSort[index].descending ? oldSort[index].descending : false);
									oldSort[index].descending = _sortOpt[(++id) % _sortOpt.length];
									newSort = oldSort[index];
									notFound = false;
								}
							}

							if (grid.multiSort) {
								// If sorting option of new sort is "none" (id == 3), remove sort on this column (target)
								if (!notFound && (index - 1) >= 0 && id >= (_sortOpt.length - 1)) {
									oldSort.splice((index - 1), 1);
								}
							} else {
								// single sort
								oldSort = []; // remove oldSort
								// if option is "none", sort will be empty
								if (newSort && newSort.descending != _sortOpt[_sortOpt.length - 1]) {
									notFound = true; // insert
								}
							}

							// if selected column is not sorted, add to sort order
							if (notFound) {
								oldSort.push(newSort);
							}

							// Emit an event with the new sort
							eventObj = {
								bubbles : true,
								cancelable : true,
								grid : grid,
								parentType : event.type,
								sort : oldSort
							};

							if (listen.emit(target, "dgrid-sort", eventObj)) {
								if (!notFound && (index - 1) >= 0 && id >= (_sortOpt.length - 1)) {
									var targ = target.contents || target;
									put(targ, "!dgrid-sort-up!dgrid-sort-down");
									put(targ.firstChild, "!");
								}

								grid.set("sort", oldSort);
							}

							break;
						}
					} while ((target = target.parentNode) && target != headerNode);
				}
			});

		},

		_setSort : function(property, descending) {
			// summary:
			//		Sort the content
			// property: String|Array
			//		String specifying field to sort by, or actual array of objects
			//		with attribute and descending properties
			// descending: boolean
			//		In the case where property is a string, this argument
			//		specifies whether to sort ascending (false) or descending (true)

			var sortHelper = function(a, b) {
				var aVal = a[attribute], bVal = b[attribute];
				// fall back undefined values to "" for more consistent behavior
				if (aVal === undefined) {
					aVal = "";
				}
				if (bVal === undefined) {
					bVal = "";
				}
				return aVal == bVal ? 0 : (((aVal > bVal) != descending) ? 1 : -1);
			};

			this._sort = typeof property != "string" ? property : [
				{
					attribute : property,
					descending : !!descending
				}
			];

			this.refresh();

			if (this._lastCollection) {
				var obj, i, attribute;
				for (i = property.length - 1; i >= 0; i--) {
					obj = property[i];
					// if an array was passed in, flatten to just first sort attribute
					// for default array sort logic
					if (typeof obj != "string") {
						descending = obj.descending;
						attribute = obj.attribute;
					}

					this._lastCollection.sort(sortHelper);
				}
				this.renderArray(this._lastCollection);
			}
			// update sort arrow (and order number)
			this.updateSortArrow(this._sort);
		},

		updateSortArrow : function(sort, updateSort) {
			// summary:
			//		Method responsible for updating the placement of the arrow in the
			//		appropriate header cell.  Typically this should not be called (call
			//		set("sort", ...) when actually updating sort programmatically), but
			//		this method may be used by code which is customizing sort (e.g.
			//		by reacting to the dgrid-sort event, canceling it, then
			//		performing logic and calling this manually).
			// sort: Array
			//		Standard sort parameter - array of object(s) containing attribute
			//		and optionally descending property
			// updateSort: Boolean?
			//		If true, will update this._sort based on the passed sort array
			//		(i.e. to keep it in sync when custom logic is otherwise preventing
			//		it from being updated); defaults to false

			//  Delete all arrows
			if (this._lastSortedArrows) {
				for ( var node = (this._lastSortedArrows.length - 1); node >= 0; node--) {
					put(this._lastSortedArrows[node], "<!dgrid-sort-up!dgrid-sort-down"); // remove class from parent node
					put(this._lastSortedArrows[node], "!");
					this._lastSortedArrows.splice(node, 1);
				}
			}

			if (updateSort) {
				this._sort = sort;
			}
			var counter = 1; // use to show sort order numbers from 1
			for ( var j in sort) {
				var obj = sort[j];

				if (!obj) {
					return;
				} // nothing to do if no sort is specified

				var prop = obj.attribute, desc = obj.descending, target = this._sortNode, // stashed if invoked from header click
				columns, column, i;

				delete this._sortNode;

				if (!target) {
					//visible columns header nodes are stored in subRows.headerRows[1-x] if compound columns are used
					//see dgrid/extensions/CompoundColumns
					if (this.subRows && this.subRows.headerRows) {
						columns = [];
						/*jshint loopfunc:true*/
						array.forEach(this.subRows.headerRows.slice(1), function(row) {
							Array.prototype.push.apply(columns, row);
						});
					}
					var grid = this;
					columns = columns || getColumns(grid);
					for (i in columns) {
						column = columns[i];
						if (column.field == prop || this.remapSort[column.field] == prop) {
							target = column.headerNode;
							break;
						}
					}
				}
				// skip this logic if field being sorted isn't actually displayed
				if (target) {
					target = target.contents || target;
					// place sort arrow under clicked node, and add up/down sort class
					var arrow = put(target.firstChild, "-div.dgrid-sort-arrow.ui-icon[role=presentation]"); //insert arrow

					put(target, "!dgrid-sort-up!dgrid-sort-down");
					if (sort.length > 1) {
						put(arrow, ".dgrid-sort-order", (parseInt(counter++, 10)));
					}
					put(target, desc ? ".dgrid-sort-down" : ".dgrid-sort-up");
					this._lastSortedArrows = this._lastSortedArrows ? this._lastSortedArrows : [];
					this._lastSortedArrows.push(arrow); // stash arrow node

					// call resize in case relocation of sort arrow caused any height changes
					this.resize();
				}
			}
		}
	});
});