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
	"dojo/when",
	"dojo/on",
	"dojo/query",
	"dijit/form/Button",
	"dgrid/editor",
	"gjax/dialog",
	"dojo/i18n!./nls/EnhancedEditor",
	"put-selector/put",
	"dojo/dom-style",
	"dojox/lang/functional",
	"dgrid/tree",
	"dijit/registry",
	"./Updatable",
	"xstyle/css!./resources/dgrid-edit-plugin.css"
], function(declare, lang, array, when, on, query, Button, editor, dialog, i18n, put, domStyle, df, tree, registry, Updatable) {

	var BaseEditor = declare(Updatable, {
		// summary:
		//		dgrid extension that adds editation interface
		// description:
		//		When mixed to dgrid: 
		//			optionally creates edit/delete buttons in each row
		//			optionally creates add/reset buttons in footer
		//			emits events when those buttons are clicked
		//			provides confirmation for deleting
		//		Use this extension, when you want to add buttons and want custom implementation of editation itself
		//		These events will be availible:
		//			dgrid-editor-add-new 	- called after add button is clicked
		//			dgrid-editor-edit 		- called after edit button is clicked (objectId availible on evt)
		//			dgrid-editor-editing	- called after edit button is clicked and item is loaded from store (objectId and object availible on evt), this event is newer than dgrid-editor-edit, thats the reason for strange naming convention
		//			dgrid-editor-delete		- called after delete button is clicked
		//			dgrid-editor-reset		- called after reset of grid is called, e.g. refresh, reset clicked, etc (also after save in inherited FormEditor)		
		// isAdding: boolean
		//		Flag denoting if current editMode is adding or updating (editing)
		isAdding : false,

		// _editMode: boolean
		//		Flag denoting if we are currently adding or editing an item
		_editMode : false,

		constructor : function() {
			this._editMode = false;
		},

		postMixInProperties : function() {
			this.inherited(arguments);
			//set adjustLastColumn in this method so mixin order doesnt matter (for example mixin ColumnResizer after FormEditor would set this as true)
			if (this.editorArgs.del || this.editorArgs.edit) {// if editation or deleting are turned on, dont allow to resize the last column containing action buttons
				this.adjustLastColumn = false;
			}
		},

		_setReadOnly : function(value) {
			this.readOnly = value;

			//disable/enable all delete buttons
			array.forEach(registry.findWidgets(this.domNode), function(w) {
				var iconClass = w.iconClass;
				if (iconClass === "dgrid-btnDelete") {
					w.set("disabled", value);
				}
			});

			if (this._addNewButton) {
				this._addNewButton.set("disabled", value);
			}
		},

		showFooter : true, //must be true set to true (dgrid property)

		_actionButtonColumnId : "editPlugin",
		_hasEditorButtonsConfigured : false, //remember wheter columns has been modified, in other case, reorder may cause creating another editor buttons

		// _alwaysCreateResetBtn: [const] Boolean
		//		If true, reset Button will be created by default, child implementation may change this behavior and render it only on demand
		_alwaysCreateResetBtn : true,

		// editorArgs:  __EditorArgs
		//		Object containing properties responsible for cofiguration of editation behaviour. Value is defined in gjax/dgrid/extensions/BaseEditor.__EditorArgs
		editorArgs : null,

		//default grid configuration, which are mixed with configuration of concrete grid
		__defaultEditorArgs : {
			editPluginColumnClass : "",
			disabled : false,

			//TODO: refactor, wrongly called property
			// it also influences rendering of add button (overriden by extension in denovius/_base)
			hideable : false,

			deleteWithoutConfirm : false,
			deleteDialogTitle : i18n.deleteRowTitle,
			deleteDialogMessage : i18n.deleteRowMessage,

			btnAddNewLabel : i18n.btnAddNew,
			btnResetLabel : i18n.btnRes,

			/**
			 * canEdit, canDelete could be boolean value or function which is resolved on row rendering
			 * sample of function: 
			 * params:
			 * object - data object which is displayed in row
			 * function(object){
						return object.phoneNo > 10;
			   }
			 * canAdd is function, which is evaluated on store add/udpdate/remove, form reset (displaying add btn) and fetching new data
			*/
			canAdd : function() {
				return true;
			},
			canEdit : true,
			canDelete : true,
			edit : true,
			add : true,
			del : true,
			bothEdits : false,
			defaultValues : {}
		},

		_setEditation : function(value/*boolean*/) {
			// summary:
			//		Disable / enable editation in grid
			// description:
			//		If called with false, delete/edit/add buttons will be hidden, otherwise displayed
			// value: Boolean
			//		Flag if editation should be turned on/off
			this.editorArgs.disabled = !value;
			domStyle.set(this.editNode, "display", value ? "block" : "none");
			if (this.__columns) {
				this._hasEditorButtonsConfigured = false; //ensure editor columns will be mixed if needed
				this.updateColumns(copyColumns(this.__columns));
			} else {
				console.log("setEditation not implmented for subrows yet."); //TODO for subRows
			}
			this.resize();
		},

		//returns grid editation mode, boolean
		_getEditation : function() {
			return !this.editorArgs.disabled;
		},

		create : function(params) {
			//mix concrete editorParams with default
			params.editorArgs = lang.mixin({
				grid : this
			}, this.__defaultEditorArgs, params.editorArgs);
			var columns = params.columns || this.columns;
			//copy columns definition
			if (columns) {
				this.__columns = copyColumns(columns);
			}
			this.inherited(arguments);
		},

		configStructure : function() {
			//if editation disabled, use default behavior
			if (this.editorArgs.disabled || this._hasEditorButtonsConfigured) {
				this.inherited(arguments);
				return;
			}

			//mixed css classes for grid action column
			this.__actionButtonColumnId = this._actionButtonColumnId + //
			(!(this.editorArgs.edit && (this.editorArgs.add || this.editorArgs.del)) ? "-one" : "-two"); //set id of editorArgs column for action buttons, base on this id is generated css class with correct width(one or two action buttons in cell)

			//add action column to columns definition
			this._addEditDeleteColumn();
			this.inherited(arguments);

			this._subRows = this.columnSets ? this.columnSets[this.dataColumnSetIndex || 0] : this.subRows;

			array.forEach(this._subRows, function(subRows) {//not used array.map beacause on this.subRows array may be hooked another properties(headerRows for CompoundColumns extension)
				var editorArgs = this.editorArgs;
				subRows = array.map(subRows, function(column) {//mixin editor settings for each column
					lang.mixin(column, editorArgs.columnArgs);
					if (column.editor && (!editorArgs.edit || editorArgs.bothEdits) && column.editOn) {
						if (column.editOn === "always") {
							delete column.editOn;
						}
						var eColumn = editor(column, column.editor);
						eColumn.init();
						return eColumn;
					}
					if (column.tree) {
						var tColumn = tree(column);
						tColumn.init();
						return tColumn;
					} else {
						return column;
					}
				});
			}, this);

			//remember that we have already configured editor buttons
			this._hasEditorButtonsConfigured = true;
		},

		buildRendering : function() {
			this.inherited(arguments);
			this._createEditNode();

			if (this._alwaysCreateResetBtn) {
				this._createResetBtn();
			}
		},

		refresh : function() {
			this.inherited(arguments);
			this._onReset();
		},

		//create editNode in grid's footerNode
		_createEditNode : function() {
			//if editation disabled hide display node 
			var dispStyle = this.editorArgs.disabled ? "[style=display:none]" : "";
			var footerNode = this.footerNode;
			//put edit node to the first place in footerNode
			var editNode = this.editNode = footerNode.firstChild ? put(footerNode.firstChild, "-div.dgrid-editNode" + dispStyle) : put(footerNode,
					"div.dgrid-editNode" + dispStyle); //put div as first footerChild

			/*jshint expr:true*/
			!this.editorArgs.hideable && put(editNode, ".footerEditorVisible");

			//if hideable true, create addNewBtn which turn on edit mode
			if (this.editorArgs.hideable && this.editorArgs.add) {
				this._createAddBtn();
			}
		},

		_createAddBtn : function() {
			this._addNewButton = new Button({
				label : this.editorArgs.btnAddNewLabel,
				'class' : "addNewBtn",
				onClick : lang.hitch(this, "_onAdd"),
				disabled : !!this.readOnly
			}, put(this.editNode, "div"));

			if (!this.editorArgs.canAdd()) {
				this._addNewButton.hide();
			}
		},

		//create reset btn in footerNode, btn turn off edit mode
		_createResetBtn : function() {
			this._resetButton = new Button({
				label : this.editorArgs.btnResetLabel,
				'class' : "resetBtn",
				onClick : lang.hitch(this, function() {
					this._onReset();
					this.set("editMode", false);
				})
			}, put(this.editNode, "div"));
			this._resetButton.hide();
		},

		//turn on/off edit mode (show hide concrete grid's components)
		_setEditMode/*refactor name*/: function(value) {
			if (this.editorArgs.hideable) {
				if (this._addNewButton) {
					this._addNewButton[value ? "hide" : (this.editorArgs.canAdd() ? "show" : "hide")]();
				}
				if (this._resetButton) {
					this._resetButton[value ? "show" : "hide"]();
				} else {
					this.resize();
					put(this.editNode, (value ? "." : "!") + "footerEditorVisible");
				}
				//if we going to show edit area adn using columnSets scroll to beginning of the sets
				if (value && this.setColumnSets) {
					array.forEach(query(".dgrid-column-set-cell .dgrid-column-set", this.editNode), function(node) {
						//this ensure that on scroll event is emited every time
						node.scrollLeft = node.scrollLeft ? 0 : 1;
					});
				}
			}
			this._editMode = value;
			if (this._resetButton && !this._addNewButton) {
				//footer size will change in this case
				this.resize();
			}
		},

		_getEditMode : function() {
			return this._editMode;
		},

		destroy : function() {

			this._beingDestroyed = true; //inspired by _WidgetBase

			//destroy add, reset buttons
			array.forEach(registry.findWidgets(this.editNode), function(w) {
				if (w.destroyRecursive) {
					w.destroyRecursive();
				} else if (w.destroy) {
					w.destroy();
				}
			});

			this.inherited(arguments);
		},

		//add actionColumn (edit, add to grid's columns definition)
		_addEditDeleteColumn : function() {
			if (!this.editorArgs.del && !this.editorArgs.edit) {// if both editation and deleting are turned off, we dont need extra column
				return;
			}
			//actionButtons column definition
			var column = this._editDeleteColumn = {//push column for actionsButtons(del, edit) to existing structure
				id : this.__actionButtonColumnId,
				field : this.__actionButtonColumnId,
				label : " ",
				grid : this,
				renderCell : lang.partial(renderEditDeleteButtons, this),
				sortable : false,
				unhidable : true,
				resizable : false,
				rowSpan : this.subRows ? this.subRows.length : 1,
				className : "dgrid-cell-columnButton dgrid-column-editPlugin"
			};

			if (this.columnSets) {
				this.columnSets.push([
					[
						column
					]
				]);
			} else if (this.columns) {
				this.columns = this.columns;
				if (this.columns instanceof Array) {
					this.columns.push(column);
				} else {
					this.columns[column.field] = column;
				}
			} else if (this.subRows) {
				this.subRows[0].push(column);
			}
		},

		_onAdd : function() {
			this.set("editMode", true);
			this.set("isAdding", true);
			this._emitEvent("dgrid-editor-add-new");
		},

		_onEdit : function(objectId, node) {
			this._emitEvent("dgrid-editor-edit", {
				objectId : objectId,
				node : node
			});
			this._trackError("_edit", [
				objectId,
				node
			]);
			this.set("isAdding", false);
		},

		_onDelete : function(objectId, node) {
			this._emitEvent("dgrid-editor-delete", {
				objectId : objectId,
				node : node
			});
			//show dialog with question and then resolve base
			this._trackError("_delete", [
				this.editorArgs.deleteWithoutConfirm ? true : dialog.question(this.editorArgs.deleteDialogTitle, this.editorArgs.deleteDialogMessage),
				objectId,
				node
			]);
		},

		_onReset : function(evt) {
			/*jshint expr:true*/
			evt && evt.preventDefault();
			this._emitEvent("dgrid-editor-reset");
			this._reset();
		},

		_edit : function(objectId/*, node*/) {
			//get object base on id and emit its data
			return when(this.store.get(objectId))//
			.then(lang.hitch(this, function(object) {
				this._doEdit(objectId, object);
				this.highlightRow(objectId);
				this.set("editMode", true);
			}));
		},

		_doEdit : function(objectId, object) {
			this._emitEvent("dgrid-editor-editing", {
				objectId : objectId,
				object : object
			});
		},

		_delete : function(answerReady, objectId) {
			//resolve promise with user answer
			return when(answerReady)//
			.then(lang.hitch(this, function(answer) {
				// if true delete, otherwise do nothing				
				if (answer) {
					return this._doDelete(objectId);
				}
			}));
		},

		_doDelete : function(objectId) {
			this.store.remove(objectId);
			delete this.dirty[objectId];
			this._reset();
			this._emitEvent("dgrid-editor-deleted", {
				objectId : objectId
			});
		},

		// reset dgrid editor components to default values(state) 
		_reset : function() {
			this.clearHighlight();
			this.set({
				editMode : false,
				isAdding : false
			});
		},

		_getDefaultValues : function() {
			//resolve defaultValues attr defined for concrete grid, could object or function
			var defaultValues = this.editorArgs.defaultValues;
			return typeof defaultValues === "function" ? defaultValues() : lang.clone(defaultValues);
		},

		_emitEvent : function(eventName, eventParams) {
			return on.emit(this.domNode, eventName, lang.mixin({
				bubbles : true,
				cancelable : true,
				grid : this
			}, eventParams));
		},

		renderArray : function() {
			!this._beingDestroyed && this._addNewButton && !this.get("editMode") && this._addNewButton.set("hidden", !this.editorArgs.canAdd());
			return this.inherited(arguments);
		},

		newRow : function() {
			!this._beingDestroyed && this._addNewButton && !this.get("editMode") && this._addNewButton.set("hidden", !this.editorArgs.canAdd());
			return this.inherited(arguments);
		},

		removeRow : function() {
			!this._beingDestroyed && this._addNewButton && !this.get("editMode") && this._addNewButton.set("hidden", !this.editorArgs.canAdd());
			return this.inherited(arguments);
		}
	});

	//function for rendering action column cell per row in grid
	function renderEditDeleteButtons(grid, object, value, node/*, options*/) {
		//REVIEW: why is columnButton not used?
		var widgets = [], editorArgs = grid.editorArgs;
		/*jshint expr:true*/
		editorArgs.editPluginColumnClass && put(node, "." + editorArgs.editPluginColumnClass);

		if (editorArgs.edit) {
			var canEdit = editorArgs.canEdit;
			widgets.push(createButton(grid, object, node, canEdit, "Edit"));
		}

		if (editorArgs.del) {
			var canDelete = editorArgs.canDelete;
			widgets.push(createButton(grid, object, node, canDelete, "Delete"));
		}

		array.forEach(widgets, function(widget) {
			widget.startup();
		});
	}

	//helper function for creating buttons(edit, delete)
	function createButton(grid, object, node, enabled, type, props) {
		var isEnabled = typeof enabled === "function" ? enabled(object) : enabled;
		var enableHandlerProp = isEnabled ? {//hook onClick handler only if editation is allowed
			onClick : lang.hitch(grid, "_on" + type, grid.store.getIdentity(object), node)
		} : {};
		/*jshint expr:true */
		var disabled = (!isEnabled || (grid.readOnly && type == "Delete"));

		return new Button(lang.mixin(enableHandlerProp, {
			showLabel : false,
			label : grid.editorArgs["btn" + type + "Label"] || i18n["btn" + type],
			iconClass : "dgrid-btn" + type,
			onMouseDown : function(evt) {
				evt.stopPropagation();
			},
			disabled : !!disabled
		}, props), put(node, "div"));
	}

	//helper function for clone columns definition
	function copyColumns(columns) {
		return df.map(columns, function(column) {
			return lang.mixin({}, column);
		});
	}

	/*=====
	BaseEditor.__EditorArgs = declare(null, {
		// editPluginColumnClass: 
		//		css class for action column
		editPluginColumnClass : "",
		
		// disabled: 
		//		disable/enable editation
		disabled : false,

		// hideable:
		//		???
		hideable : false, //TODO: refactor, wrongly called property, it also influences rendering of add button (overriden by extension in denovius/_base)

		// deleteWithoutConfirm: 
		//		If true, confirmation dialog will not be displayed (default false)
		deleteWithoutConfirm : false,
		// deleteDialogTitle: 
		//		Title of delete confirmation dialog
		deleteDialogTitle : i18n.deleteRowTitle,
		// deleteDialogMessage: 
		//		Text of delete confirmation dialog
		deleteDialogMessage : i18n.deleteRowMessage,

		// btnAddNewLabel: 
		//		Label of add new button
		btnAddNewLabel : i18n.btnAddNew,
		// btnResetLabel: 
		//		Label of reset new button
		btnResetLabel : i18n.btnRes,

		// add:
		//		If true, creating new items is allowed in grid 
		//		May be overriden by canAdd fn.
		add : true,
		// edit:
		//		If true, editation is allowed in grid.
		//		May be overriden per row by canEdit fn.
		//		If both edit & del are false, column with buttons is not even created
		edit : true,
		// del:
		//		If true, deleting is allowed in grid.
		//		May be overriden per row by canDelete fn.
		//		If both edit & del are false, column with buttons is not even created
		del : true,
		
		canAdd : function() {
			// summary:
			//		Method that returns flag denoting if add button should be displayed. called on store add/udpdate/remove, form reset (displaying add btn) and fetching new data
			return true;
		},
		// canEdit: Boolean|Function
		//		Flag or function called on row rendering which checks if given data (row) can be edited (if false, edit button is disabled)
		canEdit : true, //REVIEW: it's strange to define this as boolean, it makes sense to define as function, but if I want to enable/disable all, I would override edit/del flags
		// canDelete: Boolean|Function
		//		Flag or function called on row rendering which checks if given data (row) can be deleted (if false, edit button is disabled)
		canDelete : true,
		
		// bothEdits:
		//		If set to true objects can be edited inline in grid and also throught edit button  (default false)
		bothEdits : false,

		// defaultValues: Object|Function
		//		default values for formController, could be object or function which return object
		defaultValues : {}
	});
	=====*/

	return BaseEditor;

});