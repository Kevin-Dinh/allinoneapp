/**
 * @author arakovsky + others Extends _FormValueWidget
 */
define([
	"dojo/_base/lang",
	"dojo/query",
	"dijit/form/_FormValueWidget",
	"dijit/form/CheckBox",
	"dojo/aspect",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/dom-style",
	"dojo/html",
	"dojo/on",
	"dojo/mouse",
	"dojo/_base/window",
	"dojo/dom-attr",
	"dojo/dom",
	"dijit/registry",
	"gjax/encoders/html/encodeSmp",
	"dijit/form/SimpleTextarea",
	"gjax/log/level"
], function(lang, query, _FormValueWidget, CheckBox, aspect, domConstruct, domClass, domStyle, html, on, mouse, win, domAttr, dom, registry, encHtml,
		simpleTextarea, level) {
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _FormValueWidget - get / set label features add");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _FormValueWidget - disabled, readOnly attribute patches label class");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: _FormValueWidget - disabled, readOnly attribute values normalized to boolean");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: hovering state is state is set on widget when label is hovered");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: _FormValueWidget - node.disabled replaced by node.readOnly to allow proper styling in IE");

	_FormValueWidget.prototype._origDisabledSetter = _FormValueWidget.prototype._setDisabledAttr;
	_FormValueWidget.prototype._origReadOnlySetter = _FormValueWidget.prototype._setReadOnlyAttr;
	CheckBox.prototype._origDisabledSetter = CheckBox.prototype._setDisabledAttr;
	CheckBox.prototype._origReadOnlySetter = CheckBox.prototype._setReadOnlyAttr;
	var extension = {

		labelPosition : null,

		_getLabelNodesAttr : function() {
			// summary:
			//		Getter for label nodes
			// returns:	NodeList
			return query("label[for='" + this.id + "']");
		},
		_getLabelNodeAttr : function() {
			// summary:
			//		Getter for label node. Returns first if more labels found
			// returns:	DomNode?			
			return this._getLabelNodesAttr()[0];
		},

		//returns null if label was not found
		_getLabelAttr : function() {
			// summary:
			//		Getter for label text. 
			// returns:	String?
			//		Returns first label text if more labels found. Null if no label was found.
			var labelNode = this.get("labelNode");
			if (!labelNode) {
				return null;
			}
			return labelNode.innerHTML;/* git-qa */
		},

		_setLabelAttr : deferUntilStartup(function(labelText, position, empty) {
			var labelNode = this.get("labelNode");
			if (labelNode) {
				//label already exists
				var spans = query("span", labelNode);
				html.set(spans && spans[0] || labelNode, encHtml(labelText));
			} else {
				//label needs to be created
				if (position !== "after") {
					position = this.labelPosition ? this.labelPosition : "before";
				}
				var params = {
					"for" : this.id,
					innerHTML : encHtml(labelText),
					"class" : empty ? "empty-label" : ""
				};
				domConstruct.create("label", params, this.domNode, position);
				if (this.disabled) {
					_toggleLabelClass(this, "disabled", true);
				}
				if (this.readOnly) {
					_toggleLabelClass(this, "read-only", true);
				}
				this._updateLabelTitle();
			}
			this._updateTitleFromLabel(labelText);
			this._updateTextareaLabel();
		}),

		_setTitleAttr : function(title, generated) {
			if (this.getInherited(arguments)) {
				this.inherited(arguments);
			} else {
				var defaultNode = this.focusNode && !lang.isFunction(this.focusNode) ? "focusNode" : "domNode";
				domAttr.set(this[defaultNode], "title", title);
				this._set("title", title);
			}
			if (!generated) {
				this._hasOwnTitle = this.title && this.title.length;
			}
			this._updateLabelTitle();
		},

		startup : function() {
			this.inherited(arguments);
			this._updateTitleFromLabel();
			this._updateLabelTitle();
			this._updateTextareaLabel();
			if (this.hidden) {
				// ensure hidden labels
				this._hideLabels();
			}
			if (this.invisible) {
				// ensure invisible labels
				this.set("invisible", true);
			}
			if (this.disabled) {
				// ensure disabled class on label
				_toggleLabelClass(this, "disabled", true);
			}
			if (this.readOnly) {
				// ensure read-only class on label
				_toggleLabelClass(this, "read-only", true);
			}
		},

		buildTitleFromLabel : null,

		_updateTextareaLabel : function() {
			if (this.isInstanceOf(simpleTextarea)) {
				var label = this.get("labelNode");
				if (label) {
					domClass.add(label, "gjaxTextAreaLabel");
				}
			}
		},

		_updateTitleFromLabel : function(label) {
			if (this._hasOwnTitle) {
				return;
			}
			label = label || this.get("label") || "";
			this.set("title", this.buildTitleFromLabel ? this.buildTitleFromLabel(label) : label, true);
		},

		_updateLabelTitle : function() {
			var title = this.get("title");
			if (this._hasOwnTitle && title) {
				var labelNode = this.get("labelNode");
				if (labelNode) {
					var spans = query("span", labelNode);
					domAttr.set(spans && spans[0] || labelNode, "title", title);
				}
			}
		},

		_originLabelsDisplayStyle : [], //rememeber origin display value for all labels (widgets like  CurrencyTextBox has more than one label)

		_showLabels : function() {
			var labels = this.get("labelNodes");
			for (var i = 0; i < labels.length; i++) {
				domClass.remove(labels[i], "gjaxHidden");
			}
		},
		_hideLabels : function() {
			var labels = this.get("labelNodes");
			for (var i = 0; i < labels.length; i++) {
				domClass.add(labels[i], "gjaxHidden");
			}
		},

		show : function() {
			this.inherited(arguments);
			this._showLabels();
		},

		hide : function(keepLabels) {
			if (keepLabels !== true) {
				this._hideLabels();
			}
			this.inherited(arguments);
		},

		_setInvisibleAttr : function(invisible) {
			var labels = this.get("labelNodes");
			for (var i = 0; i < labels.length; i++) {
				domClass.toggle(labels[i], "gjaxInvisible", invisible);
			}
			this.inherited(arguments);
		},

		_setDisabledAttr : function(disabled) {
			disabled = !!disabled;
			this._origDisabledSetter.apply(this, [
				disabled
			]);
			// workaround for styling in IE, because it doesn't allow styling disabled widgets
			// we replace 'disabled' on node by 'readonly'
			if (this.focusNode.type != "checkbox" && this.focusNode.type != "radio") { //do not change original behavior for checkboxes and radios, there is no problem with original for them 
				//this change would break checkboxes, since readonly only prevents changing value, not state 
				domAttr.set(this.focusNode, {
					disabled : false,
					readonly : this.readOnly || disabled,
					tabIndex : disabled ? -1 : 0
				});
			}
			_toggleLabelClass(this, "disabled", disabled);
		},

		_setReadOnlyAttr : function(readOnly) {
			this._origReadOnlySetter.apply(this, [
				!!readOnly
			]);

			if (this.disabled && this.focusNode.type != "checkbox" && this.focusNode.type != "radio") {
				domAttr.set(this.focusNode, 'readonly', true);
				domAttr.set(this.focusNode, 'tabIndex', -1);
			}

			_toggleLabelClass(this, "readOnly", readOnly);
		},

		preserveLabelsOnDestroy : false,

		destroy : function() {
			if (!this.preserveLabelsOnDestroy) {
				this.get("labelNodes")// returns nodelist
				.forEach(domConstruct.destroy);
			}
			this.inherited(arguments);
		}
	};

	on(win.body(), on.selector("label", mouse.enter), function(evt) {
		var labelNode = evt.target;
		var id = domAttr.get(labelNode, "for");
		var input;
		if (id && (input = dom.byId(id))) {
			var w = registry.getEnclosingWidget(input);
			/*jshint expr:true */
			w && w.set("hovering", true);
		}
	});
	on(win.body(), on.selector("label", mouse.leave), function(evt) {
		var labelNode = evt.target;
		var id = domAttr.get(labelNode, "for");
		var input;
		if (id && (input = dom.byId(id))) {
			var w = registry.getEnclosingWidget(input);
			/*jshint expr:true */
			w && w.set("hovering", false);
		}
	});

	_FormValueWidget.extend(extension);
	CheckBox.extend(extension);

	function _toggleLabelClass(w, cssClass, value) {
		var labels = w.get("labelNodes");
		for (var i = 0; i < labels.length; i++) {
			domClass.toggle(labels[i], cssClass, value);
		}
	}

	function deferUntilStartup(funct) {
		return function() {
			if (this._started) {
				funct.apply(this, arguments);
			} else {
				var handle = aspect.before(this, "startup", lang.partial(function(args) {
					handle.remove();
					funct.apply(this, args);
				}, arguments));
			}
		};
	}

});