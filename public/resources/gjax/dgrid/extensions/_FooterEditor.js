/**
 * author: akumor
 *
 * samples: /tst/dgrid/enhanced-editor
 *
 * */

define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-style",
	"dojo/query",
	"dojo/on",
	"gjax/mvc/at",
	"dojox/mvc/sync",
	"gjax/mvc/converters",
	"put-selector/put",
	"dojo/i18n!./nls/EnhancedEditor",

	"dijit/form/ValidationTextBox",
	"dijit/form/Button",
	"dijit/form/Form",
	"dojo/aspect"
], function(declare, lang, array, domStyle, query, on, at, sync, converters, put, i18n, ValidationTextBox, Button, Form, aspect) {
	return declare(null, {

		skipFormValidation : true,

		//array of created columns for footerEditor
		_editorColumns : null,

		buildRendering : function() {
			this.inherited(arguments);
			//render form for editation to grid's footer
			this._createFooterEditor();
		},

		startup : function() {
			if (this._started) {
				return;
			}
			this.inherited(arguments);
			var form = this.footerForm;
			form.startup();
			//sync form submit btn disabled with form state
			syncBtnSaveWithForm(form, this);

			//bind form in grid footer to FormEditor
			this.bindForm(this.footerForm);

			//bind scrolling events for columnSets
			if (this.setColumnSets) {
				array.forEach(query(".dgrid-column-set-cell .dgrid-column-set", this.editNode), function bindScrollEvt(node) {
					this._listeners.push(on(node, "scroll", lang.hitch(this, this._onColumnSetScroll)));
				}, this);
			}

			this.own(//
			aspect.after(this, "_setEditMode", lang.hitch(this, "resize", null, null))//
			);
		},

		resize : function() {
			this.inherited(arguments);
			this._resizeFooterEditorColumns();
		},

		destroy : function() {
			this.footerForm.destroyRecursive();
			return this.inherited(arguments);
		},

		_createFooterEditor : function() {
			this._createEditorColumns();
			this._renderFooterEditor();
		},

		_createEditorColumns : function() {
			this._editorColumns = array.map(this._subRows || this.subRows, function(subRow) {
				return array.map(subRow, function(column) {// set id base on field for each column
					var footerColumn = lang.mixin({}, column, this.editorArgs.columnArgs);
					var editor = footerColumn.editor;
					var hasExplicitlyDefinedEditor = typeof editor === "function";
					footerColumn.editorArgs = lang.mixin({}, {// mix in default props for widget
						editable : hasExplicitlyDefinedEditor,
						disabled : !hasExplicitlyDefinedEditor
					}, footerColumn.editorArgs);

					if (footerColumn.field === this.__actionButtonColumnId) {
						// use already existing actionButtonColumn (override edit, delete with save, reset buttons)
						footerColumn.renderCell = lang.hitch(this, renderSaveResetButtons);
					} else if (editor !== false) {
						// use as default editor ValidationTextBox
						footerColumn.editor = hasExplicitlyDefinedEditor ? editor : ValidationTextBox;

						// add binding
						lang.mixin(footerColumn.editorArgs, this._buildAtBinding(footerColumn));
					}
					return footerColumn;
				}, this);
			}, this);

			if ((!this.editorArgs.edit && !this.editorArgs.del) || this.editorArgs.disabled) {// if edit and delete are not allowed, add new column for save and reset just to footer
				// push last column with actionButtons(res, save) to structure
				this._editorColumns[0].push(this._getActionButtonColumn());
			}
		},

		_buildAtBinding : function(column) {
			var editor = column.editor;
			var rels = column.field.split(".");
			var propRel = rels.pop();
			var objRel = rels.join(".");

			if (editor.prototype.declaredClass === "dijit.form.CheckBox") {/* git-qa */
				// different binding for CheckBoxes
				return {
					checked : at("rel:" + objRel, propRel)
				};
			}
			if (editor.prototype.declaredClass === "dijit.form.CurrencyTextBox") {/* git-qa */
				// apply transform fnc for CurrencyTextBox
				return {
					value : at("rel:" + objRel, propRel).transform(converters.currency)
				};
			}

			return column.resolvedEnumEditor ? {
				// resolvedItem for FilteringSelects with resolvedEnumEditor
				resolvedItem : at("rel:" + objRel, "resolved:" + propRel + (column.resolvedField ? ":" + column.resolvedField : ""))
			} : { // default
				value : at("rel:" + objRel, propRel)
			};
		},

		_getActionButtonColumn : function() {
			return {
				id : this.__actionButtonColumnId,
				field : this.__actionButtonColumnId,
				renderCell : lang.hitch(this, renderSaveResetButtons),
				rowSpan : this.subRows ? this.subRows.length : 1
			};
		},

		_renderFooterEditor : function() {
			var form = this.editContainer = this.footerForm = new Form(null, this._formNode);//form for editable widgets, call startup in grid startup
			//create widgets for editation to form in grid's footer
			put(form.domNode, ">", this.setColumnSets ? this._createFooterRowCells("td") : this._renderFooterEditorFields());
		},

		_createFooterRowCells : function(tag) {
			var colsetidAttr = "data-dgrid-column-set-id";
			var row = put("table.dgrid-row-table");
			var tr = put(row, "tbody tr");
			for (var i = 0, l = this.columnSets.length; i < l; i++) {
				// iterate through the columnSets
				var cell = put(tr, tag + ".dgrid-column-set-cell.dgrid-column-set-" + i + " div.dgrid-column-set[" + colsetidAttr + "=" + i + "]");
				cell.appendChild(this._prerenderFooterEditorFields(this.columnSets[i][0][0].id == this.__actionButtonColumnId));
			}
			return row;
		},
		_prerenderFooterEditorFields : function(lastSet) {
			if (lastSet) {
				return this._renderFooterEditorFields([
					[
						this._getActionButtonColumn()
					]
				]);
			}
			return this._renderFooterEditorFields();
		},

		_renderFooterEditorFields : function(editorColumns) {
			//render footer cells for editation with same structure as ordinary rows in grid body
			var tableRow, rowNode = put("div.dgrid-row[role=row]");
			var table = put(rowNode, "table.dgrid-row-table[role=presentation]");
			var form = this.footerForm;
			array.forEach(editorColumns || this._editorColumns, function(subRow, index) {
				tableRow = put(table, "tr");
				array.forEach(subRow, function(column) {
					var cellAttr = [
						"td.dgrid-cell.dgrid-cell-padding.field-",
						column.field,
						".dgrid-column-",
						column.field,
						"[role=gridcell]"
					];
					if (column.className) {
						cellAttr.push(".", column.className);
					}
					if (column.rowSpan) {
						cellAttr.push("[rowspan=", column.rowSpan, "]");
					}
					if (column.colSpan) {
						cellAttr.push("[colspan=", column.colSpan, "]");
					}

					var cell = put(tableRow, cellAttr.join(""));
					if (column.editor && typeof column.editor == "function") {
						//use editorArgs.attachPoint when you have two widgets binded into same column field
						form["_" + (column.editorArgs.attachPoint || column.field)] = new column.editor(column.editorArgs, put(cell, "div"));
					} else if (column.renderCell) {
						column.renderCell(null, null, cell);
					}
				});
				if (!index) {//put on end of first line td with width of scrollbar
					put(tableRow, "td.dgrid-scrollbar-width[style=padding:0px]");
				}
			});

			return rowNode;
		},

		_resizeFooterEditorColumns : function() {
			//resize just when edit and delete are forbidden so we must find some place for action buttons in footer
			//this place is taken from last column
			if (!this.editorArgs.edit && !this.editorArgs.del && this.editNode) {
				var headerNodes = query(".dgrid-cell", query("tr", this.headerNode)[0]/*firstSubheader*/);
				var cellNodes = query(".dgrid-cell", query("tr", this.editNode)[0]/*firstSubrow*/);
				//get width of saveBtn column
				var redundantWidth = domStyle.get(cellNodes[cellNodes.length - 1], "width");
				var headerNode = headerNodes[headerNodes.length - 1]; // get last header column
				var cellNode = cellNodes[cellNodes.length - 2]; // get last cell before btnColumn
				domStyle.set(cellNode, "width", (domStyle.get(headerNode, "width") - redundantWidth) + "px");//reduce width by redundantWidth
			}
		}
	});

	function renderSaveResetButtons(object, value, node, showLabel/*, options*/) {
		if (!this.editorArgs.formEditor) {
			put(node, "." + this._editPluginColumnClass);
		}

		var saveBtn = this.footerForm.saveBtn = new Button({
			label : i18n.btnSave,
			disabled : true,
			iconClass : "dgrid-btnSubmit" + (this.editorArgs.plusIcon ? "Plus" : ""),
			showLabel : !!showLabel,
			type : "submit"
		}, put(node, "div"));
		saveBtn.startup();

		if (this.editorArgs.edit && this.editorArgs.add) {
			var resetBtn = new Button({
				label : i18n.btnRes,
				iconClass : "dgrid-btnReset",
				showLabel : !!showLabel,
				type : "reset"
			}, put(node, "div"));
			resetBtn.startup();
		}
	}

	function syncBtnSaveWithForm(form, grid) {
		if (form.saveBtn) {
			sync(form, "state", form.saveBtn, "disabled", {
				bindDirection : sync.from,
				converter : {
					format : function(val) {
						return grid.readOnly || val !== "";
					}
				}
			});
		}
	}
});
