define([
	"dojox/lang/functional",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/on",
	"dojo/dom-construct",
	"put-selector/put",
	"dojo/html",
	"dojo/dom-class",
	"dijit/registry",
	"dojo/dom-style"
], function(df, declare, lang, array, on, domConstruct, put, html, domClass, registry, domStyle) {

	return declare(null, {
		// summary:
		//		Extension that allows you to define columns displayed in footer (also for OnDemandGrid)
		// description:
		//		You can update value in footer columns anytime by calling setter
		// example:
		//		footerColumns = {
		//			field1 : "Total:",
		//			field5 : {
		//				label : "50",
		//				formatter : myCustomFormatterFunction,
		//				className : "boldText",
		//				widgetClass : Button
		//				widgetProps : {label : "clickHere"}
		//			}
		//		}
		//
		//		grid.set("footerColumn", "field5", 150, 0)
		//		grid.set("footerColumns", footerColumnsObjDef)

		footerColumns : false, //user defined structure
		_multiLine : null, // flag if we have multi line footer

		_footerColumnsNode : null,
		
		buildRendering : function() {
			var hasFooter = this.showFooter = (lang.isObject(this.footerColumns) || this.footerColumns === true);
			this._origFooterColumns = []; //we must save orig footerColumns definition, for example for reusing same formatter when setting footer value on demand 
			this._footerColumns = []; //footer column domNodes

			this.inherited(arguments);
			if (hasFooter) {
				this._createFooterColumns();
			}
		},
		destroy : function() {
			array.forEach(registry.findWidgets(this.footerNode), function(w) {
				w.destroyRecursive();
			});
			domConstruct.destroy(this.footerNode);
			return this.inherited(arguments);
		},

		_setFooterColumn : function(column, value, /*integer*/rowIndex) {
			rowIndex = rowIndex || 0; // first line is updated if no rowIndex

			// if rowIndex is higher than length, do nothing
			if (rowIndex >= this._footerColumns.length) {
				return /*undefined*/;
			}

			var footerColumns = this._footerColumns[rowIndex], origFooterColumns = this._origFooterColumns[rowIndex];

			var footerColumnNode = footerColumns[column], origFooterColumnDef = origFooterColumns[column];

			if (footerColumnNode) {
				array.forEach(registry.findWidgets(footerColumnNode), function(w) {
					w.destroyRecursive();
				});

				var renderWidget = false;

				var label, className, formatter;
				if (lang.isObject(value)) {
					renderWidget = !!value.widgetClass;

					if (!renderWidget) {
						label = (value.label || ""), className = value.className, formatter = value.formatter;
						if (typeof formatter == "string" && this.formatterScope) {
							formatter = this.formatterScope[formatter];
						}

						if (value.className) {
							domClass.add(footerColumnNode, value.className);
						}

						if (formatter) {
							origFooterColumnDef = origFooterColumns[column] = lang.mixin({}, origFooterColumnDef, {
								formatter : formatter
							});
							label = formatter(label);
						} else {
							label = label.toString();
						}
					}
				} else {
					if (origFooterColumnDef.formatter) {
						formatter = origFooterColumnDef.formatter;
						if (typeof formatter == "string" && this.formatterScope) {
							formatter = this.formatterScope[formatter];
						}
						value = formatter(value);
					}
					label = (value || "").toString();
				}

				if (!renderWidget) {
					html.set(footerColumnNode, label);/* git-qa *///may be HTML
				} else {
					var W = value.widgetClass;
					if (W) {
						var widget = new W(value.widgetProps || {}, put(footerColumnNode, "div"));
						widget.startup();
					}
				}
			}
		},

		_setFooterColumns : function(column, value, /*Integer?*/rowIndex) {
			// example:
			//		Signatures of this methosd are getting ridiculous:
			//	
			//	|	grid.set("footerColumns", /*String*/ colName, /*Object*/ colValue, /*Integer?*/ colIndex);
			//	|	grid.set("footerColumns", /*Object*/ colObject, /*Integer?*/ colIndex, /*Boolean?*/ keepOriginalCols);
			//	|	grid.set("footerColumns", /*Array*/ colArray, /*Boolean?*/ keepOriginalCols);

			/*jshint shadow:true */
			if (lang.isArray(column)) {
				var keepOriginalCols = value;
				array.forEach(column, function(clmn, index) {
					this._setFooterColumns(clmn, index, keepOriginalCols);
				}, this);
			} else if (lang.isObject(column)) {
				var keepOriginalCols = rowIndex;
				rowIndex = value || 0;

				if (!keepOriginalCols) {
					//cleanup old columns, becasue we could receive new structure which has less columns
					var _footerColumns = this._footerColumns[rowIndex];
					var oldColumns = df.keys(_footerColumns), newColumns = df.keys(column);

					array.forEach(oldColumns, function(c) {
						if (!~array.indexOf(newColumns, c)) {
							this._cleanupFooterColumn(c, rowIndex);
						}
					}, this);
				}

				for ( var c in column) {
					this._setFooterColumn(c, column[c], rowIndex);
				}
			} else {
				this._setFooterColumn(column, value, rowIndex || 0);
			}
		},

		_cleanupFooterColumn : function(column, rowIndex) {
			var _footerColumns = this._footerColumns[rowIndex];
			var footerColumnNode = _footerColumns[column];

			array.forEach(registry.findWidgets(footerColumnNode), function(w) {
				w.destroyRecursive();
			});
			domConstruct.destroy(footerColumnNode);
			delete this._footerColumns[column];
		},

		_createFooterRow : function(footerColumns) {
			// check if we have columnSets, use first columnSet
			var rows = this.columnSets ? this.columnSets[0] : this.subRows;

			return array.map(rows, function(subRow) {
				return array.map(subRow, function(column) {//set id base on field for each column
					var userDef = footerColumns[column.field];
					var label, className, formatter, colSpan, widgetClass, widgetProps;
					if (lang.isObject(userDef)) {
						label = userDef.label || "";
						className = userDef.className || null;
						formatter = userDef.formatter;
						colSpan = userDef.colSpan;
						widgetClass = userDef.widgetClass;
						widgetProps = userDef.widgetProps;
					} else {
						label = userDef || "";
					}

					if (typeof formatter == "string" && this.formatterScope) {
						formatter = this.formatterScope[formatter];
					}

					if (!widgetClass) {
						if (formatter) {
							label = formatter(label);
						} else {
							label = label.toString();
						}
					}

					var footerColumnDefinition = {
						field : column.field,
						formatter : formatter,
						colSpan : colSpan,
						widgetClass : widgetClass,
						widgetProps : widgetProps
					};
					footerColumnDefinition.innerHTML = label; /* git-qa *///may be HTML

					if (className) {
						footerColumnDefinition.className = className;
					}

					return footerColumnDefinition;
				}, this);
			}, this);
		},

		_createFooterColumns : function() {
			if (!lang.isArray(this.footerColumns)) {
				this.footerColumns = [
					this.footerColumns
				];
			}

			this._footerStructure = [];
			this._origFooterColumns = lang.clone(this.footerColumns);

			array.forEach(this.footerColumns, function(footerColumnRow) {
				this._footerColumns.push({}); // create empty structure, will be filled later
				this._footerStructure.push(this._createFooterRow(footerColumnRow));
			}, this);

			var parentNode = this.footerNode;
			// if columnSetScroll, place footerColumns to croller contect to be able to scroll
			if (this._columnSetScrollerContents) {
				parentNode = this._columnSetScrollerContents[0];
				domStyle.set(parentNode, "height", "auto");
			}

			var footerColumnsHolder = this._footerColumnsNode = parentNode.firstChild ? //
			put(parentNode.firstChild, "-div.dgrid-footer-columns") : //
			put(parentNode, "div.dgrid-footer-columns"); //put div as first footerChild			

			this._renderFooterTable(footerColumnsHolder);
		},

		_renderFooterTable : function(footerColumnsHolder) {
			array.forEach(registry.findWidgets(this.footerNode), function(w) {
				w.destroyRecursive();
			});

			array.forEach(this._footerStructure, function(row, index) {
				put(footerColumnsHolder, ">", this._renderFooterColumns(row, index));
			}, this);
		},

		_renderFooterColumns : function(footerRow, rowIndex) {
			var tableRow, rowNode = put("div.dgrid-row[style=overflow-x:hidden]");
			var row = this._footerColumns[rowIndex];

			this.on("scroll", function(event) {
				rowNode.scrollLeft = event.scrollTarget.scrollLeft;
			});
			var table = put(rowNode, "table.dgrid-row-table[role=presentation]");

			array.forEach(footerRow, function(subRow, index) {
				tableRow = put(table, "tr");
				array.forEach(subRow, function(column) {
					var cellAttr = [
						"td.dgrid-cell.dgrid-cell-padding.field-",
						column.field,
						".dgrid-column-",
						column.field
					];

					if (column.className) {
						cellAttr.push("." + column.className);
					}
					cellAttr.push("[role=gridcell]");
					if (column.rowSpan) {
						cellAttr.push("[rowspan=", column.rowSpan, "]");
					}
					if (column.colSpan) {
						cellAttr.push("[colspan=", column.colSpan, "]");
					}

					row[column.field] = put(tableRow, cellAttr.join(""), {
						innerHTML : column.innerHTML
					/* git-qa *///may be HTML
					});

					var W = column.widgetClass;
					if (W) {
						var widget = new W(column.widgetProps || {}, put(row[column.field], "div"));
						widget.startup();
					}

				}, this);
				if (!index) {//put on end of first line td with width of scrollbar
					put(tableRow, "td.dgrid-scrollbar-width[style=padding:0px]");
				}
			}, this);

			return rowNode;
		}
	});
});