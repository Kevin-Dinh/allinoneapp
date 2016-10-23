define([
	"dijit/form/_TextBoxMixin",
	"dojo/_base/lang",
	"dojo/keys", // keys.BACKSPACE, keys.TAB
	"gjax/log/level",
	"dojo/aspect",
	"dojo/has"
], function(_TextBoxMixin, lang, keys, level, aspect, has) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _TextBoxMixin - selectOnClick default changed to true, overridable by has config preventSelectOnClick");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _TextBoxMixin - trim changed to true");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _TextBoxMixin - added option filterControlChars to filter invisible characters");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: _TextBoxMixin - stop propagation of backspace key event on readonly/disabled fields");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: _TextBoxMixin - value is processed before TAB navigation takes place");

	var origPostCreate = _TextBoxMixin.prototype.postCreate;
	var origFilter = _TextBoxMixin.prototype.filter;

	_TextBoxMixin.extend({
		// PM: selectOnClick:true as default behaviour, select all text in inputs by click
		// LZ: preventSelectOnClick added to allow changing default behaviour, if not specified, it is still true
		selectOnClick : !has("preventSelectOnClick"),

		// AR: changed default to true
		trim : true,

		// LZ: filter control characters from user inputs, usually not typed by user, but can be copied from documents (pdf,...)
		filterControlChars : true,

		postCreate : function() {
			var hasOnKeyHandler = this._onKey; // provided by _HasDropDown

			// JU: stop backspace on readonly/disabled fields - would bubble to browser and cause 'history back'
			// NOTE: disabled widgets will also have textbox.readOnly property - see ./_FormValueWidget#_setDisabledAttr
			this.on("keydown", function(evt) {
				if (this.textbox.readOnly && evt.keyCode === keys.BACKSPACE) {
					evt.preventDefault();
					return false;
				}
				if (!hasOnKeyHandler && evt.keyCode === keys.TAB) {
					// JU: Make sure that value is processed before we navigate to next widget.
					// This matters in situations where next widget's navigability (i.e. disabled state) depends on value of this widget.
					this._setBlurValue();
				}
			});

			if (hasOnKeyHandler) {
				this.own(aspect.after(this, "_onKey", lang.hitch(this, function(/*Event*/evt) {
					if (evt.keyCode === keys.TAB) {
						// JU: in widgets with _onKey handler, do this only after, because _onKey usually aborts any pending queries
						// that causes problems because _setBlurValue will usualy start query for items (on widgets with dropdown)
						this._setBlurValue();
						// AR: for filtering select which needs to query async store there is no possibility to achieve requested feature
						// and calling _setBlurValue will cause wrong behaviour for this case
						// _setBlurValue, will query store, blur of the widget will abort the query
						// and _setBlurValue will be called again, but it will not make new query, because
						// there is a check if(typeof this.item == "undefined"), which is not true (previous _setBlurValue has set it to null)
						// so assign undefined to item!

						// for situiations where query is sync (e.g. already loaded LazyMemory), this works as expected
						if (this._fetchHandle) {
							this.item = undefined;
						}
					}
				}), true));
			}

			return origPostCreate.apply(this, arguments);
		},

		filter : function() {
			var val = origFilter.apply(this, arguments);

			if(typeof val != "string"){
				return val;
			}

			if (this.filterControlChars) {
				val = val.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uD800-\uDFFF]/g, "");
			}

			return val;
		}
	});
});
