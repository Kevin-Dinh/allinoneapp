define([
	"dgrid/Selection",
	"dojo/html",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojox/lang/functional",
	"gjax/dgrid/util/event",
	"dojo/i18n!./nls/EnhancedSelection",
	"dojo/dom-construct",
	"dojo/string",
	"gjax/encoders/html/encodeSmp",
	"dojo/aspect",
	"dojo/when",
	"gjax/error",
	"dojo/_base/array"
], function(Selection, html, declare, lang, df, eventUtil, i18n, domConstruct, string, encHtml, aspect, when, error, array) {

	return declare(Selection, {
		// summary:
		//		Provides convenient getters for selected items.
		// description:
		//		dgrid mixin which provide additional convenient methods to Selection mixin for accessing selected items.
		//		Also provides new selection mode "radio", which ensures exactly one row is selected at every time.
		// example:
		//		A writeup of an example.
		//		| code
		// 

		// preselectFirstRow: Boolean
		//		Flag if first row should be selected after grid is loaded.
		preselectFirstRow : false,

		// allowTextSelection: Boolean
		//		Whether to still allow text within cells to be selected.  The default
		//		behavior here is yes.
		allowTextSelection : true,

		// showSelectedNo: Boolean
		//		If true, shows number of selected record in grid footer (depends or Pagination or Total to provide suitable footer)
		showSelectedNo : false,

		_selectedItems : null, // this object may contain also objects that are not longer selected, don't use it directly!
		_selectedIndex : null,

		_radioSelectionHandler : function(event, target) {
			// summary:
			//		Selection handler for "radio" mode, where exactly one target must be
			//		selected at a time (unless no data).
			if (this._lastSelected === target) {
				this.select(target);
			} else {
				this.clearSelection();
				this.select(target);
				this._lastSelected = target;
			}
		},

		hasSelectedItems : function() {
			// summary:
			//		Returns true if any row is currently selected.
			for ( var id in this.selection) {
				if (this.selection[id]) {
					return true;
				}
			}
			return false;
		},

		getSelectedIds : function() {
			// summary:
			//		Returns identities of all currently selected rows.
			var ids = [];
			for ( var id in this.selection) {
				if (this.selection[id]) {
					// ids are numeric most of the time
					ids.push(isNaN(id) ? id : +id);
				}
			}
			return ids;
		},

		getSelectedItems : function() {
			// summary:
			//		Returns items of all currently selected rows.
			return this.getSelectedIds().map(function(id) {
				return this.row(id).data || this._selectedItems[id];
			}.bind(this));
		},

		getLastSelectedItem : function() {
			// summary:
			//		Returns item of most recently selected row.
			for ( var id in this.selection) {
				if (this.selection[id]) {
					return this.row(id).data || this._selectedItems[id];
				}
			}
		},

		_getSelectedRowPosition : function() {
			// summary:
			//		Find selected index of row and total rows in grid.
			// returns:	String
			//		Row index if noly one row is selected.
			//		"*" if multiple rows are selected.
			//		"-" if no rows are selected.
			//		"?" if one row is selected but it is not rendered for some reason.

			var selectedCount = this.selection && df.keys(df.filterIn(this.selection, "val")).length;
			if (selectedCount != 1) {
				// nothing or multiple selected
				this._selectedIndex = null;
				return selectedCount === 0 ? "-" : "*";
			}
			for ( var id in this.selection) {
				if (this.selection[id]) {
					var row = this.row(id);
					// if row has no element after refresh, use last known _selectedIndex - row is probably not rendered (on some unshown page)
					this._selectedIndex = row.element ? row.element.rowIndex : this._selectedIndex;
					// 0-based
					return this._selectedIndex != null ? this._selectedIndex + 1 : "?";
				}
			}
		},

		// getAllItemIds: Function?
		//		When provided, this function will be used to select all items (regardless of paging) when selectAll is called.
		//		Can return just item stubs (e.g. just IDs) for performance reasons
		getAllItems : null,

		selectAll : function() {
			if (typeof this.getAllItems != "function") {
				// select
				this.inherited(arguments);
				return;
			}

			this.allSelected = true;
			this.selection = {};
			when(this.getAllItems()).then(lang.hitch(this, function(items) {
				array.forEach(items, function(item) {
					var id = this.store.getIdentity(item, true);
					this._select(id, null, true);
					this._selectedItems[id] = item;
				}, this);
				this._fireSelectionEvents();
			})).otherwise(error.errbackDialog);
		},

		_createSelectedRecordNode : function() {
			// placemet positions: after pagination status OR after total status OR first in footer
			var prevNode = this._footerColumnsNode || this.paginationStatusNode || this._totalNode;
			return domConstruct.create("div", {
				"class" : "gjax-dgrid-selection-record"
			}, prevNode || this.footerNode, prevNode ? "after" : "first");
		},

		_hSelectedRecordChange : function(clearIndex) {
			if (clearIndex) {
				this._selectedIndex = null;
			}
			var isTotal = this._total != null && !isNaN(this._total);
			html.set(this._selectedRecordNode, string.substitute(i18n.selectedRecord, {
				selected : this._getSelectedRowPosition(),
				total : isTotal ? this._total : "*"
			}, encHtml));
		},

		buildRendering : function() {
			this.inherited(arguments);

			if (this.selectionMode != "none" && this.showSelectedNo && this.showFooter) {
				var selectedRecordNode = this._selectedRecordNode = this._createSelectedRecordNode();
				this.on("dgrid-refresh-complete,dgrid-page-complete", lang.hitch(this, "_hSelectedRecordChange", false));
				this.on("dgrid-select,dgrid-deselect", lang.hitch(this, "_hSelectedRecordChange", true));
				this.own(aspect.after(this, "refresh", function() {
					html.set(selectedRecordNode, ""); /* git-qa */
				}));
			}
		},

		startup : function() {
			this.inherited(arguments);

			// Dynamically updates map of selected items to provide synchronous "getSelectedItems" implementation
			// Note that rowDeselect event may not fire when deselection un unrendered page, _selectedItems may therefore contain
			// more items that are actually selected
			this._selectedItems = {};
			this.on(eventUtil.rowSelect, lang.hitch(this, function(event) {
				for ( var i = 0, l = event.rows.length; i < l; i++) {
					this._selectedItems[event.rows[i].id] = event.rows[i].data;
				}
			}));
			this.on(eventUtil.rowDeselect, lang.hitch(this, function(event) {
				for ( var i = 0, l = event.rows.length; i < l; i++) {
					delete this._selectedItems[event.rows[i].id];
				}
			}));

			// preselect first row after every refresh
			if (this.selectionMode == "radio" || (this.preselectFirstRow && this.selectionMode != "none")) {
				this.on(eventUtil.refreshCompleteData, lang.hitch(this, function(items) {
					if (items && items.length) {
						if (!this.deselectOnRefresh && df.keys(this.selection).length && this.store /*paranoia?*/
								&& array.some(items, function(item) {
									return this.selection[this.store.getIdentity(item)];
									// find if the selected item is still in grid after refresh. If not, ignore "deselectOnRefresh"
								}, this)) {
							return;
						}

						this.clearSelection();
						this.select(items[0]);
						this._lastSelected = this.row(items[0]).element;//so radio works correclty, and we may not select first item again
					}
				}));
			}
		}
	});
});