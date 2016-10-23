define([
	"dojo/_base/declare",
	"dojox/lang/functional"
], function(declare, df) {

	return declare(null, {
		
		_resultsObservers : null,
		
		// summary:
		//		Extension that allows to update rows without fetching the store (Experimental module)
		// description:
		//		Extension allows to update (rerender) rows, after grid's subRows object has been changed
		//		This module uses built-in feature of grid, that handles rows update for observable stores
		renderArray : function(results, preloadNode, options) {
			if ("queryLevel" in options) {
				// this is renderArray for tree subrows, do not observe this result - it will be rerendered with parent
				return this.inherited(arguments);
			}
			var grid = this;
			var origObserve = results.observe;
			results.observe = function(listener, includeObjectUpdates) {
				var origHandle;
				if (origObserve) {
					origHandle = origObserve.call(results, listener, includeObjectUpdates);
				}
				var resultsObservers = grid._resultsObservers || (grid._resultsObservers = {});
				var observerId = Math.random();
				
				resultsObservers[observerId] = function() {
					results.forEach(function(obj, index) {
						// original results array is only used to get IDs
						// it may contain obsolete data (if put happened), therefore we always read actual data from grid row
						var id = grid.store.getIdentity(obj);
						var row = grid.row(id);
						if (row && row.data) {
							// this will cause rerendering of row
							grid._updatingStructure = true;
							listener(row.data, index, index);
							grid._updatingStructure = false;
							
							// if we have Selection mixin 
							grid.selection && grid._reselectRow(obj);							
						}
					});
				};

				return {
					cancel : function() {
						if (grid._updatingStructure) {
							// updating structure causes removing and adding rows, do not cancel observers yet
							return;
						}
						if (origHandle && origHandle.cancel) {
							origHandle.cancel();
						}
						delete resultsObservers[observerId];
					}
				};
			};
			return this.inherited(arguments);
		},

		updateRows : function(subRows, doNotResize) {
			// summary:
			//		Updates grid rows.
			// description:
			//		Update current rows in grid without fetching the store. All rows will be re-rendered. Exctept of headers.
			//		Use after change in grid.subRows 
			// doNotResize: Boolean?
			//		If set to true 'resize' will not be called

			this.subRows = subRows;
			this._updateStructure(doNotResize);
		},

		updateColumns : function(columns, doNotResize) {
			// summary:
			//		Updates grid rows.
			// description:
			//		Update current rows in grid without fetching the store. All rows will be re-rendered. Exctept of headers.
			//		Use after change in grid.subRows 
			// doNotResize: Boolean?
			//		If set to true 'resize' will not be called

			delete this.subRows;
			this.columns = columns;
			this._updateStructure(doNotResize);
		},

		_updateStructure : function(doNotResize) {
			this.configStructure();
			this.renderHeader();

			this._updateRows();
			this.updateSortArrow(this.get("sort"));

			if (!doNotResize) {
				this.resize();
			}
		},
		
		_updateRows : function() {
			var hasRows = !!df.keys(this._rowIdToObject).length;//
			if (hasRows) { // skip if grid does not yet have any rows
				df.forIn(this._resultsObservers, function(observer) {
					observer();
				});
			}
		},

		_reselectRow : function(object) {
			//simulate Selection.js method 'ifSelected'
			var row = this.row(object);
			var selection = row && this.selection[row.id];
			if (selection) {
				this.select(row, null, selection);
				if (this.selectionMode == "radio") {
					this._lastSelected = row.element;
				}
			}
		}
	});
});