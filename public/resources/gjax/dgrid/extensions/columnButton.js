// TODO refactor to dojo DOC
/*
 * HOW TO USE:
 * when defining dgrid columns simly call this renderer
 * columns : {
 * 		id : i18n("ID"),
		myButton : columnButton(handler),
		//predefined buttons
		detail : columnButton.detail(handler),
		//custom
		twoButtons : columnButton([
			{
				label : "actions", //text for column header
				iconClass : "dgrid-del-button",
				title : i18n("delete title"),
				onClick : handler
			},
			{
				text : "Edit", //text displayed in button
				title : i18n("edit title"),
				onClick : handler,
				disabled : function(object, grid) {
					return object.age < 50; // TODO: add promise support
				},
				hidden : function (object, grid) {
					return callSvc(object); // supports promises (will be hidden until resolved)
				}
			}
		])
 * }
 *
 * First parameter is handler or custom definition.
 * For column definition you can define:
 * - field : field used for column
 * - label : label used for column header, default empty string
 * - className : css class used for column, default empty string
 *
 * - text : label for button, when defined, iconClass is beign ignored
 * - iconClass : css class for button, default dgrid-custom-button
 * - onClick : function for calling when user clicks on button
 * - disabled : boolean or function to decide whether button is disabled or not, default false
 *
 * Functions onClick and disabled will receive row data object and grid reference as their parameters.
 *
 * All other parameters (such as 'title') will be set to button.
 *
 * As a second parameter you can pass name of css class that will be set on row when click appears,
 * or boolean value, when you want to disable highlighting
 * Higlight class is by default taken from grid.highlightRowClass parameter
 *
 *
 * This plugin defines some predefined buttons:
 * text, edit, del (delete), detail, editAndDetal (edit and delete into one column).
 *
 * All generated columns will be enhanced with .dgrid-cell-actionBtn class.
 */
define([
	"dojo/_base/lang",
	"dojo/_base/array",
	"put-selector/put",
	"dijit/form/Button",
	"gjax/tdi/LinkButton",
	"gjax/dialog",
	"dojo/i18n!./nls/columnButton",
	"dojo/when",
	"gjax/lang/blacklistMixin",
	"dojo/aspect",
	"dojox/lang/functional",
	"dojo/dom-class",
	//
	"xstyle/css!./resources/dgrid-column-button.css"
], function(lang, array, put, Button, LinkButton, dialog, i18n, when, blacklistMixin, aspect, df, domClass) {

	var DEFAULT_CLASSNAME = "dgrid-cell-columnButton";

	var _methods = {
		//predefined button columns with predefined classes
		text : function(text, propsOrHandler, highlightRowClass) {
			return this._resolve.call(this, false, propsOrHandler, highlightRowClass, text);
		},
		detail : function(propsOrHandler, highlightRowClass) {
			return this._resolve.call(this, "detail", propsOrHandler, highlightRowClass);
		},

		edit : function(propsOrHandler, highlightRowClass) {
			return this._resolve.call(this, "edit", propsOrHandler, highlightRowClass);
		},
		del : function(propsOrHandler, highlightRowClass) {
			var deleteButton = _methods._enhanceWithDialog(_methods._getButtonDefinition(propsOrHandler, "del"));

			return this._getColumnDefinition({
				field : deleteButton.field,
				label : deleteButton.label,
				className : deleteButton.className,
				buttons : [
					deleteButton
				]
			}, highlightRowClass);
		},
		editAndDelete : function(editPropsOrHandler, deletePropsOrHandler, highlightRowClass) {
			var editButton = _methods._getButtonDefinition(editPropsOrHandler, "edit");
			var deleteButton = _methods._enhanceWithDialog(_methods._getButtonDefinition(deletePropsOrHandler, "del"));

			return this._getColumnDefinition({
				label : editButton.label || deleteButton.label,
				field : editButton.field || deleteButton.field,
				className : editButton.className || deleteButton.className,
				buttons : [
					editButton,
					deleteButton
				]
			}, highlightRowClass);
		},
		link : function(propsOrHandler, highlightRowClass) {
			var buttonProps = _methods._getButtonDefinition(propsOrHandler, "link");
			buttonProps.buttonModule = buttonProps.buttonModule || LinkButton;

			var column = this._getColumnDefinition({
				colSpan : buttonProps.colSpan,
				field : buttonProps.field,
				label : buttonProps.label,
				className : buttonProps.className,
				buttons : [
					buttonProps
				]
			}, highlightRowClass);

			// hitch all passed functions with 'object' and 'grid', then set them to widget again
			aspect.after(column, "renderCell", function(object, data, td) {
				var hitchedGetters = df.mapIn(df.filterIn(buttonProps, function(prop, k) {
					return typeof prop == "function" && typeof td.widget[k] == "function";
				}), function(funct) {
					return lang.partial(funct, object, this.grid);
				}, this);
				td.widget.set(hitchedGetters);
			}, true);

			return column;
		},

		_enhanceWithDialog : function(buttonDef) {
			if (buttonDef.deleteWithoutConfirm) {
				return buttonDef;
			}
			return lang.mixin({}, buttonDef, {
				onClick : function(object, grid) {
					when(dialog.question(i18n.deleteDialogTitle, i18n.deleteDialogMessage), function(result) {
						if (result) {
							if (buttonDef.onClick) {
								buttonDef.onClick.call(null, object, grid);
							}
						}
					});
				}
			});
		},
		_resolve : function(icon, propsOrHandler, highlightRowClass, text) {
			var button = _methods._getButtonDefinition(propsOrHandler, icon, text);
			if (text) {
				lang.mixin(button, {
					text : text
				});
			}
			return this._getColumnDefinition({
				label : button.label,
				field : button.field,
				className : button.className,
				buttons : [
					button
				]
			}, highlightRowClass);
		},
		_getButtonDefinition : function(propsOrHandler, icon) {
			var button = icon ? {
				iconClass : "dgrid-" + icon + "-button"
			} : {};
			if (typeof propsOrHandler === "function") {
				button.onClick = propsOrHandler;
			} else {
				lang.mixin(button, propsOrHandler);
			}
			return button;
		},
		_getColumnDefinition : function(columnDefinition, highlightRowClass) {
			var className = columnDefinition.className;

			return {
				"colSpan" : columnDefinition.colSpan || null,
				"field" : columnDefinition.field || null,
				"className" : DEFAULT_CLASSNAME + (className ? (" " + className) : ""),
				"sortable" : false,
				"unhidable" : true,
				"resizable" : false,
				"label" : columnDefinition.label || " ",
				"renderCell" : function(object, data, td, options) {
					var grid = this.grid;
					array.forEach(columnDefinition.buttons, function(props) {
						var d = props.disabled;
						var disabled = typeof d === "function" ? !!d(object, grid) : typeof d === "boolean" ? d : false;
						var h = props.hidden;
						var hiddenPromise = null;
						var hidden = typeof h === "function" ? h(object, grid) : typeof h === "boolean" ? h : false;
						if (hidden.then) {
							hiddenPromise = hidden;
							hidden = true;//we will hide the widget until promise is resolved
						}

						var buttonProps = {
							disabled : disabled,
							hidden : hidden, //hidden function may return promise, so temporarily hide
							onClick : function(evt) {
								if (highlightRowClass !== false) {
									grid.highlightRow(object, highlightRowClass);
								} else {
									//cancel highlight
									grid.clearHighlight();
								}

								if (props.onClick) {
									props.onClick.call(null, object, grid, evt);
								}
							}
						};

						// add button label OR iconClass // NTH: if we would like to specify both, also CSS must be changed, because now text is displayed only for dijitNoIcon iconClass
						if (props.text) {
							buttonProps.label = props.text;
						} else {
							buttonProps.iconClass = props.iconClass || "dgrid-custom-button";
							if (props.label && !props.title) {
								//set label at least as title, until above NTH is solved
								buttonProps.title = props.label;
							}
						}

						// mixin other unhandled button props
						blacklistMixin([
							"label",
							"field",
							"className",
							"text",
							"onClick",
							"disabled",
							"iconClass",
							"onMouseDown",
							"buttonModule",
							"hidden",
							"disabled"
						], buttonProps, props);

						var Butt = props.buttonModule || Button;

						var btn = new Butt(buttonProps, put(td, "div"));
						domClass.add(btn.focusNode, "dgrid-action-button"); // don't add via buttonProps to keep original classes

						hiddenPromise && hiddenPromise.then(function(_hidden) {
							!btn.isDestroyed() && btn.set("hidden", _hidden);
						})//
						.otherwise(function(err) {
							console.error("Error while evaluating hidden state", object, err);
						});

						td.widget = btn;
						options.startupWidgets.push(btn);
					});
				}
			};
		}
	};

	var renderer = function(propsOrHandler, highlightRowClass) {
		if (typeof propsOrHandler == "function") {
			return _methods._getColumnDefinition({
				buttons : [
					{
						onClick : propsOrHandler
					}
				]
			}, highlightRowClass);
		} else {

			var buttonsDefinition = (Object.prototype.toString.call(propsOrHandler) === '[object Array]') ? propsOrHandler : [
				propsOrHandler
			];

			var definition = {
				label : "",
				className : undefined,
				buttons : [],
				colSpan : null
			};

			array.forEach(buttonsDefinition, function(props) {
				definition.label = definition.label || props.label; // column label
				definition.field = props.field; // column field
				definition.colSpan = definition.colSpan || props.colSpan; // column colSpan
				definition.className = definition.className || props.className; // column className
				definition.buttons.push(blacklistMixin([
					"label",
					"field",
					"colSpan",
					"className"
				], {}, props));
			});

			return _methods._getColumnDefinition(definition, highlightRowClass);
		}
	};

	return lang.mixin(renderer, _methods);
});
