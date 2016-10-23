/**
 * @author: akumor
 */

define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/_base/event",
	"dojo/on",
	"dojo/query",
	"dojo/dom-construct",
	"put-selector/put",
	"dijit/form/ValidationTextBox",
	"gjax/form/_PostponedChangesMixin",
	"gjax/XString",
	"gjax/encoders/html/encodeSmp",
	"dojo/keys",
	"dijit/Tooltip",
	"dojo/i18n!./nls/Filter",
	"xstyle/css!./resources/dgrid-filter.css"
], function(declare, array, lang, event, on, query, domConstruct, put, ValidationTextBox, _PostponedChangesMixin, //
xString, encHtml, keys, Tooltip, i18n) {

	var PostponedValidationTextBox = declare([// mixin postponedChanges for default filterfields
		ValidationTextBox,
		_PostponedChangesMixin
	]);

	return declare(null, {

		// summary:
		//		Used to render filter widgets in column headers.
		// description:
		//		On filter change `dgrid-filter` event is emitted. Client should listen for it and implement his own filtering routine.
		//
		//		The event contains:
		//		 - grid - reference to grid
		//		 - filter - plain object, keys are column fields, values are filter values for matching column
		// example:
		//		Usage: setup filter in column definition
		//	|	{
		//	| 		field : "age",
		//	| 			label : i18n("age"),
		//	| 			filter : true				// defines default filter (ValidationTextBox)
		//	| 			filterArgs : {		// optional filter args
		//	| 					trim : false
		//	| 			}
		//	| 		},
		//	| 		{
		//	| 			field : "genderName",
		//	| 			label : i18n("gender"),
		//	| 			filter : FilteringSelect,	// define FilteringSelect filter
		//	| 			filterArgs : {		// optional filter args
		//	| 				store : store
		//	| 		}
		//	| 	}

		_filterFields : null,
		_filterEvents : [],

		// showResetFilter: Boolean?
		//		Displays reset filter icon in grid footer.
		showResetFilter : false,

		configStructure : function() {
			this._filterFields = [];
			this.inherited(arguments);
			this._mixinFilterFieds();
		},

		startup : function() {
			this.inherited(arguments);
			// bind scrolling events for columnSets
			if (this.setColumnSets) {
				array.forEach(query(".dgrid-column-set-cell .dgrid-column-set", this.headerNode), function bindScrollEvt(node) {
					this._listeners.push(on(node, "scroll", lang.hitch(this, this._onColumnSetScroll)));
				}, this);
			}
		},

		buildRendering : function() {
			this.inherited(arguments);
			this._addResetFilterBtn();
		},

		_mixinFilterFieds : function() { // mix filter fields in header of concrete columns
			if (this.columns) {
				for ( var columnIdentity in this.columns) {
					var column = this.columns[columnIdentity];
					if (column.filter) {
						column.renderHeaderCell = renderHeaderCell;
					}
				}
			}

			function renderHeaderCell(node) {
				// if filter value is Constructor use filter, otherwise use default ValidationTextBox with postponed changes
				var FilterClass = typeof this.filter === "function" ? this.filter : PostponedValidationTextBox;
				var constParams = lang.mixin({
					field : this.field,
					"class" : "dgrid-filter dgrid-filter-" + this.field
				}, this.filterWidgetProps, this.filterArgs);// filterWidgetProps only for backward compatibility

				var vt = this.grid["__filterField" + xString.capitalize(this.field)] = new FilterClass(constParams, put(node, "div"));
				domConstruct.create("label", {
					"for" : vt.id,
					innerHTML : encHtml(this.label || this.field),
					"class" : "dgrid-label-filter dgrid-label-filter-" + this.field
				}, vt.domNode, "before");

				vt.startup();
				this.grid._filterFields.push(vt);

				vt.on("click", function(e) { // stop propagation of click event, cause unwanted sorting
					e.stopPropagation();
				});
				this.grid._filterEvents.push(on.pausable(vt, "change", lang.hitch(this.grid, "_emitFilterChange")));
			}
		},

		_emitFilterChange : function() { // collect all filter params and emit theirs change throught dgrid-filter event
			var filterParams = this.get("filterParams");
			on.emit(this.domNode, "dgrid-filter", {
				bubbles : true,
				cancelable : true,
				grid : this,
				filter : filterParams
			});
		},

		_getFilterParams : function() {
			var filterParams = {};
			array.forEach(this._filterFields, function(widget) {
				var value = widget.checked ? widget.get("checked") : widget.get("value");
				if (value != null && value !== "") {
					filterParams[widget.field] = value;
				}
			});
			return filterParams;
		},

		_addResetFilterBtn : function() {
			if (this.showResetFilter) {
				this.set("showFooter", true); // show footer
				var paginationNode = query(".dgrid-pagination", this.footerNode);
				var filterFooterNode;
				//if there is pagination in footer, place remove filter behind it (- means before, but it is floated right by css)
				if (paginationNode && paginationNode.length) {
					filterFooterNode = put(paginationNode[0], "-div.dgrid-reset-filter-footer");
				} else {
					filterFooterNode = put(this.footerNode, "div.dgrid-reset-filter-footer");
				}
				var resetLink = this._removeFilterFooter = put(filterFooterNode, "span.ui-icon.dgrid-reset-filter");
				resetLink.setAttribute("aria-label", i18n.resetFilter);
				resetLink.tabIndex = 0;

				var grid = this;
				this.own(on(resetLink, "click,keydown", function(event) {
					// if grid is disabled do nothing
					if (grid.disabled) {
						return /*undefined*/;
					}

					if (event.type === "keydown" && event.keyCode !== keys.ENTER) {
						return;
					}
					grid.resetFilter();
				}));

				var t = new Tooltip({
					label : i18n.resetFilter
				});
				t.addTarget(resetLink);
			}
		},

		resetFilter : function(noChangeEmit) {
			array.forEach(this._filterEvents, function(h) {
				h.pause();
			});
			array.forEach(this._filterFields, function(h) {
				h._onChangeActive = false;
				h.reset();
				h._onChangeActive = true;
			});
			array.forEach(this._filterEvents, function(h) {
				h.resume();
			});
			!noChangeEmit && this._emitFilterChange();
		},

		_getFilterWidget : function(field) {
			return array.filter(this._filterFields, function(widget) {
				return widget.field == field;
			})[0];
		}
	});
});
