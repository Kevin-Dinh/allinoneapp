//Module is defined in this way, to support usage as bookmarklet 
//WARN: DO NOT USE INLINE COMMENTS, USE BLOCK
//javascript:
(function() {
	var module = require.modules["gjax/testing/findWidget"];
	if (module && module.result) {
		/*do not use try-catch to allow using break on error in dev tools without stopping here*/
		require("gjax/testing/findWidget").toggle();
	} else {
		define("gjax/testing/findWidget", [
			"dijit/registry",
			"dojo/on",
			"dojo/dom-style",
			"dojo/dom-class",
			"dojo/dom-attr",
			"dojo/_base/event",
			"dojo/_base/array",
			"dojo/_base/lang",
			"dojo/json",
			"dojo/string",
			"dijit/Tooltip",
			"dojo/has",
			"dojo/mouse",
			"dojox/lang/functional",
			"dijit/layout/TabController",
			"dijit/form/Textarea",
			"dijit/form/ComboBoxMixin",
			"dijit/form/CheckBox",
			"dijit/form/DateTextBox",
			"dijit/form/Button",
			"dijit/TitlePane",
			"dijit/Fieldset",
			"dijit/layout/TabContainer",
			"dijit/Dialog",
			"dijit/form/_FormSelectWidget",
			"dojox/form/DateTextBox",
			"dojox/form/CheckedMultiSelect",
			"dijit/form/TextBox"
		], function(registry, on, domStyle, domClass, domAttr, event, array, lang, json, string, Tooltip, has, mouse, df, TabController) {

			var win = window || {}; /*this line is needed to prevent error in build, because there is no 'window' in rhino and node*/

			var fw = {
				currentWidget : null,
				active : false,
				onActive : function(/*value*/) {
					/*this method is called on active change*/
				}
			};

			fw._handleMouseEnter = function(e) {
				event.stop(e);
				var element = e.target, widgetId;
				if (element.tagName === "LABEL") {/*identify widget to which belong label*/
					widgetId = domAttr.get(element, "for");
				}
				var w = widgetId ? registry.byId(widgetId) : registry.getEnclosingWidget(element);
				if (w) {
					if (w.isInstanceOf(Tooltip._MasterTooltip)) {
						return; /*ignore tooltips*/
					}
					if (w.isInstanceOf(TabController)) {/*on TabController enter show TabContainer info*/
						w = w.getParent();
					}
				}

				var isGrid = domClass.contains(e.target, "dgrid-cell");
				fw.targetNode = isGrid ? e.target : null;
				var node;
				e = null;
				if (fw.currentWidget == w && !isGrid) {
					return;
				} else {
					setOrigAttrs(fw.currentWidget);
				}

				fw.currentWidget = w;
				if (w && w.domNode) {
					node = w.domNode;
					node._origOutline = domStyle.get(node, "outline");
					node._origTitle = domAttr.get(node, "title");
					domStyle.set(node, "outline", "2px solid red");
					var tooltip = buildTooltip(w);

					if (tooltip) {
						Tooltip.show(tooltip, node, [
							"after",
							"before",
							"above",
							"below"
						]);
					}
				}
			};
			fw._handleClick = function() {
				if (fw.currentWidget) {
					var w = win.w = fw.currentWidget; /*expose to global so it is accesible from console*/
					if (has("webkit")) {
						console.log("%cSelected widget (assigned to window.w):", "color:green");/* git-qa */
						console.log("%c" + getIdentifier(w), "color:green;font-weight:bold");
						console.log(w);
					} else {
						console.log("Selected widget (assigned to window.w):", getIdentifier(w));
						console.log(w);
					}
					fw.toggle();
				}
			};

			fw.eventHandleEnter = on.pausable(document, on.selector("*", mouse.enter), fw._handleMouseEnter);
			fw.eventHandleClick = on.pausable(document, on.selector("*", "mousedown"), fw._handleClick);
			fw.keydownEventHandler = on.pausable(document, on.selector("*", "keydown"), function(evt) {
				if (evt.keyCode == 80 || evt.keyCode == 107) {/*"p" & "+"*/
					/* move to parent widget on "p" or "+" */
					var parent = fw.currentWidget && fw.currentWidget.getParent();
					if (parent) {
						fw._handleMouseEnter({
							preventDefault : function() {
							},
							stopPropagation : function() {
							},
							target : parent.domNode
						});
					}
				}
				if (evt.keyCode == 32) {/* SPACE */
					/* select cuurent widget (same as click) */
					fw._handleClick();
				}

			});
			fw.toggle = function() {
				if (fw.active) {
					fw.eventHandleEnter.pause();
					fw.eventHandleClick.pause();
					fw.keydownEventHandler.pause();
					setOrigAttrs(fw.currentWidget);
					fw.currentWidget = null;
				} else {
					fw.eventHandleEnter.resume();
					fw.eventHandleClick.resume();
					fw.keydownEventHandler.resume();
				}
				fw.active = !fw.active;
				fw.onActive(fw.active);
			};

			function setOrigAttrs(widget) {
				if (widget && widget.domNode) {
					var node = widget.domNode;
					if (widget.domNode._origOutline) {
						domStyle.set(node, "outline", node._origOutline);
						delete node._origOutline;
					}
					Tooltip.hide(node);
				}
			}

			function buildTooltip(w) {
				var tooltip;
				tooltip = "<em>ID:</em> <strong>" + w.id + "</strong>";

				if (w.dojoAttachPoint) {
					tooltip += "<br><em>Attach-point:</em>  <strong>" + w.dojoAttachPoint + "</strong>";
				}

				var gridColumn = getGridColumn(fw.targetNode);
				if (gridColumn) {
					tooltip += "<br><em>Grid column:</em>  <strong>" + gridColumn + "</strong>";
				}

				var vali = getVali(w);
				if (vali) {
					tooltip += "<br><em>Vali:</em>  <strong>" + vali + "</strong>";
				}

				var binding = getBinding(w);
				if (binding) {
					tooltip = (tooltip ? tooltip + "<br>" : "") + "<em>Binding:</em> <strong>" + binding + "</strong>";
				}

				tooltip += "<br>" + getIdentifier(w);
				tooltip += "<br><em>(Press 'P' for parent)</em>";

				return tooltip;
			}

			function getBinding(w) {
				if (w._refs) {
					var refs = df.mapIn(w._refs, function(val) {
						return val.targetProp;
					});
					if (df.keys(refs).length) {
						return df.reduce(refs, function(str, val, key) {
							if (str.length) {
								str += "; ";
							}
							str += key + ": " + val;
							return str;
						}, "");
					}
				}
			}

			function getIdentifier(w) {
				/*returns MID of widget if availible (provided by updateClasses), or declaredClass, or list of mixins*/
				var identifier;
				var c = w.constructor;
				if (c.__mid) {
					identifier = c.__mid;
				} else {
					updateClasses();
					identifier = c.__mid ? c.__mid : w.declaredClass;
					/*this should cover widget from markup with data-dojo-mixins*/
					if (identifier.indexOf("uniq") === 0 && c._meta && c._meta.parents && c._meta.parents.length) {
						identifier += " (" + df.reduce(c._meta.parents, constToName, "") + ")";
					}
				}
				return identifier;
			}

			function getVali(w) {
				if (!w.vali) {
					return null;
				}
				var vali = w.vali;
				if (vali.warnings) {
					vali.warnings.toJSON = function() {
						var fns = array.map(vali.warnings, function(fn) {
							return funcToString(fn);
						});
						return "[" + fns.join(", ") + "]";
					};
					return json.stringify(vali);
				}
			}

			function funcToString(fn) {
				if (fn.name) {
					return "fn:" + fn.name;
				}
				var match = fn.toString().match(/^function (.+)\(/);
				if (match) {
					return "fn:" + match[1];
				}
				return "fn";
			}

			function getGridColumn(targetNode) {
				/*if current target is grid header, get current column field*/
				if (!targetNode) {
					return null;
				}
				var m = domAttr.get(targetNode, "class").match(/field-([^ $]+)/);
				return m && m[1];
			}

			function updateClasses() {
				/*console.time("updateClasses");*/
				df.forIn(require.modules, function(module, mid) {
					if (module.result && module.result.createSubclass) {/*check if it is Dojo constructor (do no use "constructor" also plain object have them)*/
						module.result.__mid = mid;
					}
				});
				/*console.timeEnd("updateClasses");
				takes 1-3ms*/
			}

			function constToName(s, parent) {
				if (s.length) {
					s += ", ";
				}
				s += parent.__mid ? parent.__mid : parent.prototype.declaredClass;
				return s;
			}

			return fw;

		});
		require([
			"gjax/testing/findWidget"
		], function(findWidget) {
			findWidget.toggle();
		});
	}
})();
