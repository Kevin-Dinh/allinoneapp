define([
	"dojo/on",
	"dojo/when",
	"dojo/_base/lang",
	"dgrid/util/mouse",
	"dojo/_base/array"
], function(on, when, lang, mouseUtil, array) {

	// summary:
	//		Module wrapping grid events.
	//		Provides several convenient 'data' events where items are returned instead of rows.
	// example:
	//	|	this.grid.on(eventUtil.refreshCompleteData, lang.hitch(this, "gridRefreshed"));
	//	|	this.grid.on(eventUtil.rowSelectData, lang.hitch(this, "gridSelected"));

	// mouseUtil can be used for displaying tooltips on cells

	var dataChange = "dgrid-datachange", //
	refreshComplete = "dgrid-refresh-complete", //
	pageComplete = "dgrid-page-complete", //
	rowSelect = "dgrid-select", //
	rowDeselect = "dgrid-deselect", //
	error = "dgrid-error", //
	filter = "dgrid-filter", //
	resetEditor = "dgrid-editor-reset", //
	submitEditor = "dgrid-editor-submit";

	return lang.mixin({
		// simple events
		dataChange : dataChange,
		refreshComplete : refreshComplete,
		rowSelect : rowSelect,
		rowDeselect : rowDeselect,
		error : error,
		filter : filter,
		resetEditor : resetEditor,
		submitEditor : submitEditor,

		dblClickRow : mouseUtil.createDelegatingHandler(".dgrid-content .dgrid-row", "dblclick"),
		dblClickFooter : mouseUtil.createDelegatingHandler(".dgrid-footer .dgrid-cell", "dblclick"), // not using .dgrid-row to exclude .dgrid-scrollbar-width element

		// conveinent data processing events
		refreshCompleteData : function(node, listener) {
			return on(node, refreshComplete, function(event) {
				return when(event.results).then(function(results) {
					return listener.call(event.grid || this, results, event);
				});
			});
		},

		pageCompleteData : function(node, listener) {
			return on(node, pageComplete, function(event) {
				return when(event.results).then(function(results) {
					return listener.call(event.grid || this, results, event);
				});
			});
		},

		rowSelectData : function(node, listener) {
			return on(node, rowSelect, function(event) {
				var items = array.map(event.rows, function(row) {
					return row.data;
				});
				return listener.call(event.grid || this, items, event);
			});
		},

		rowDeselectData : function(node, listener) {
			return on(node, rowDeselect, function(event) {
				var items = array.map(event.rows, function(row) {
					return row.data;
				});
				return listener.call(event.grid || this, items, event);
			});
		},

		saveEditorSuccess : function(node, listener) {
			return on(node, "dgrid-editor-afterSubmit", function(event) {
				return listener.call(this, event);
			});
		},

		deleteEditorSuccess : function(node, listener) {
			return on(node, "dgrid-editor-afterDelete", function(event) {
				return listener.call(this, event);
			});
		}

	}, mouseUtil); // mix other mouse utils
});