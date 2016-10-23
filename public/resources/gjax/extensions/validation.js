define([
	"dijit/form/ValidationTextBox",
	"dojox/form/CheckedMultiSelect",
	"dijit/form/Select",
	"gjax/form/_ValidationTextareaMixin",
	"dijit/form/TextBox",
	"dijit/form/_TextBoxMixin",
	"dgrid/Grid",
	"dojo/i18n!gjax/extensions/nls/form",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/dom-attr",
	"dojo/aspect",
	"gjax/log/level",
	"gjax/form/ListInput"
], function(ValidationTextBox, CheckedMultiSelect, Select, _ValidationTextareaMixin, TextBox, _TextBoxMixin, Grid, i18nForm, lang, domClass, domAttr, aspect,
		level, ListInput) {
	/*jshint expr:true */

	var REQUIRED_CLASS = "gjaxRequired";
	var REQUIRED_LABEL_CLASS = "gjaxRequiredLabel";
	var REQUIRED_MARK_ATTR = "data-required-mark";

	level("debug", "gjax/extensions")
			&& console.debug("GJAX EXTEND: ValidationTextBox, _ValidationTextareaMixin, Select, CheckedMultiSelect - setting required class and title");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Grid - setting required class for headers");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _TextBoxMixin, TextBox - readOnly textboxes will also process focus");

	//AR: Select and CheckedMultiSelect does not inherit from ValidationTextBox, so extending only validation text is not enough
	//Required methods (_setRequiredAttr) are not event implemented in common _FormSelectWidget (Select isn't even direct child of _FormSelectWidget)
	//So we have to extend all of them like this

	ValidationTextBox.extend({
		_setRequiredAttr : setRequiredAttrFactory(ValidationTextBox.prototype._setRequiredAttr),

		buildRendering : buildRenderingFactory(),

		buildTitleFromLabel : buildTitleFromLabel,

		startup : startup
	});

	_ValidationTextareaMixin.extend({
		_setRequiredAttr : setRequiredAttrFactory(_ValidationTextareaMixin.prototype._setRequiredAttr),

		buildRendering : buildRenderingFactory(),

		buildTitleFromLabel : buildTitleFromLabel,

		startup : startup
	});

	Select.extend({
		_setRequiredAttr : setRequiredAttrFactory(Select.prototype._setRequiredAttr),

		buildRendering : buildRenderingFactory(Select.prototype.buildRendering),

		buildTitleFromLabel : buildTitleFromLabel,

		startup : startup
	});

	ListInput.extend({
		_setRequiredAttr : setRequiredAttrFactory(ListInput.prototype._setRequiredAttr),

		buildRendering : buildRenderingFactory(ListInput.prototype.buildRendering),

		buildTitleFromLabel : buildTitleFromLabel,

		startup : startup
	});

	CheckedMultiSelect.extend({
		_setRequiredAttr : function(required) {
			domClass.toggle(this.domNode, REQUIRED_CLASS, required);
			this._updateTitleFromLabel();
			//CMS does not have setter
			this._set("required", required);
		},

		buildRendering : buildRenderingFactory(CheckedMultiSelect.prototype.buildRendering),

		_setTitleAttr : {
			node : "domNode"
		},

		buildTitleFromLabel : buildTitleFromLabel,

		startup : startupFactory(CheckedMultiSelect.prototype.startup)
	});

	var gridRenderHeaderOrig = Grid.prototype.renderHeader;

	Grid.extend({
		renderHeader : function() {
			// PM: check also compound headers
			function processHeader(headerRow) {
				var index;
				for (index in headerRow) {
					var col = headerRow[index];

					if (lang.isArray(col)) {
						processHeader(col);
					} else {
						var headerNode = col.headerNode;
						if (headerNode) {
							var required =
							// required editor
							(col.editor && col.editable !== false && col.editorArgs && col.editorArgs.required)
							// required filter
							|| (col.filter && col.filterArgs && col.filterArgs.required);

							domClass.toggle(headerNode, REQUIRED_LABEL_CLASS, !!required);
							domAttr.set(headerNode, REQUIRED_MARK_ATTR, i18nForm.requiredChar);
						}

					}
				}
			}
			gridRenderHeaderOrig.apply(this, arguments);
			// coumpound headers has headerNodes stores in this.subRows.headerRows
			var rowId = this.id + "-header", columns = (this.subRows && this.subRows.headerRows) || this._rowIdToObject[rowId];
			processHeader(columns);
		}
	});

	var textBoxMixinOnFocusOrig = _TextBoxMixin.prototype._onFocus;
	_TextBoxMixin.extend({

		_onFocus : function() {
			textBoxMixinOnFocusOrig.apply(this, arguments);
			// also readonly widgets will process focus, original code just returns.
			if (this.readOnly) {
				this.inherited(arguments);
				this._refreshState();
			}
		}
	});

	var textBoxOnFocusOrig = TextBox.prototype._onFocus;
	TextBox.extend({
		_onFocus : function() {
			textBoxOnFocusOrig.apply(this, arguments);
			// also readonly widgets will process focus, original code just returns.
			if (this.readOnly) {
				this.inherited(arguments);
				this._updatePlaceHolder();
			}
		}
	});

	function startupFactory(orig) {
		return function() {
			orig && orig.apply(this, arguments);
			startup.apply(this, arguments);
		};
	}

	function startup() {
		if (this._started) {
			return;
		}
		this.inherited(arguments);
		var labels = this.get("labelNodes");
		for ( var i = 0; i < labels.length; i++) {
			domClass.toggle(labels[i], REQUIRED_LABEL_CLASS, this.required);
			domAttr.set(labels[i], REQUIRED_MARK_ATTR, i18nForm.requiredChar);
		}

		this.own(aspect.after(this, "_setLabelAttr", lang.hitch(this, function() {
			var labels = this.get("labelNodes");
			for ( var i = 0; i < labels.length; i++) {
				domClass.toggle(labels[i], REQUIRED_LABEL_CLASS, this.required);
				domAttr.set(labels[i], REQUIRED_MARK_ATTR, i18nForm.requiredChar);
			}
		})));
	}

	function setRequiredAttrFactory(orig) {
		return function(required) {
			orig ? orig.apply(this, arguments) : this.inherited(arguments);
			domClass.toggle(this.domNode, REQUIRED_CLASS, required);
			this._updateTitleFromLabel();

			var labels = this.get("labelNodes");
			for ( var i = 0; i < labels.length; i++) {
				domClass.toggle(labels[i], REQUIRED_LABEL_CLASS, required);
			}
		};
	}

	function buildRenderingFactory(orig) {
		return function() {
			orig ? orig.apply(this, arguments) : this.inherited(arguments);
			domAttr.set(this.domNode, REQUIRED_MARK_ATTR, i18nForm.requiredChar);
		};
	}

	function buildTitleFromLabel(label) {
		if (!this.required) {
			return label;
		}
		return label.length ? label + " (" + i18nForm.requiredTitle + ")" : i18nForm.requiredTitle;
	}

});
