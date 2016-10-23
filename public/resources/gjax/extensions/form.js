define([
	"dijit/form/Form",
	"dojo/_base/kernel",
	"dojo/_base/array",
	"gjax/focus",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"gjax/log/level"
], function(Form, kernel, array, focus, lang, domAttr, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: form submit event is stopped automatically if falsy return (no return)");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: form: disabled setter added to disable all form widgets");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: form: correctly freezes/unfreezes all form widgets");

	level("debug", "gjax/extensions") && console.debug("GJAX FIX: setting default value of doLayout parameter of form to false");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: prevent [object Object] to be set as target (in mvc binding)");

	Form.extend({
		// doLayout: [protected] Boolean //COPIED from titlePane
		// 		Don't change this parameter from the default value.
		// 		This ContentPane parameter doesn't make sense for Form, since Form should never try to control
		// 		the size of an inner widget.
		doLayout : false,
		_onSubmit : function(e) {
			var fp = this.constructor.prototype;

			// AR: if form was submitted by ENTER on some text field, call '_onBlur'
			// it will cause that the value of the field will be copied to model (MVC),
			// otherwise the model would not receive this value (because blur was not rised on the field)
			// This problem does not occuer on standard form.get("value"), because this method explicitly pulls the value from widgets
			focus.blurCurrentWidget();
			// AR: end

			// TO_DOJO_DO: remove this if statement beginning with 2.0
			if (this.execute != fp.execute || this.onExecute != fp.onExecute) {
				kernel.deprecated("dijit/form/Form:execute()/onExecute() are deprecated. Use onSubmit() instead.", "", "2.0");
				this.onExecute();
				this.execute(this.getValues());
			}
			try {
				if (!this.onSubmit(e)) { // any false value stops submit
					e.stopPropagation();
					e.preventDefault();
				}
			} catch (err) {
				// stop event also if error was thrown, rethrow afterwards
				e.stopPropagation();
				e.preventDefault();
				throw err;
			}
		},

		//AR: prevent [object Object] to be set as target (in mvc binding)
		_setTargetAttr : function(target) {
			if (lang.isObject(target)) {
				domAttr.remove(this.domNode, "target");
			} else {
				domAttr.set(this.domNode, "target", target);
			}
			this._set("target", target);
		},

		onSubmit : function(/*Event?*//*===== e =====*/) {
			return false; // Boolean
		},

		_setDisabledAttr : function(val) {
			array.forEach(this._getDescendantFormWidgets(), function(w) {
				w.set("disabled", val);
			});
		},

		_setReadOnlyAttr : function(val) {
			array.forEach(this._getDescendantFormWidgets(), function(w) {
				w.set(w.readOnly == null ? "disabled" : "readOnly", val);
			});
		},

		_freezeChildren : function(on, prop, value, state) {
			// summary:
			//		Internal method for freezing children (if available).
			// tags:
			//		protected extension

			array.forEach(this._getDescendantFormWidgets(), function(ch) {
				ch._freeze(on, prop, value, state);
			});
		}

	});

});