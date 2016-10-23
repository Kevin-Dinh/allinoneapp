define([
	"dojo/text!./templates/Select.html",
	"dijit/form/Select",
	"gjax/log/level"
], function(template, Select, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX FIX: Select - changed template");

	//AR: template of Select was changed for the same as has FilteringSelects, which bring two benefits:
	//		1. same styling for both widgets
	//		2. fixed 'http://bugs.dojotoolkit.org/ticket/15038'
	//	all 27 tests for dijit/form/Select works correctly with this extension

	//	for correct display, this css rule should be added
	//	.gjaxOptionElipsed{
	//	       white-space: nowrap;
	//		text-overflow: ellipsis;
	//		overflow: hidden;
	//		width: 100%;
	//	}

	Select.extend({
		templateString : template,
		baseClass : "dijitTextBox dijitComboBox dijitValidationTextBox",
		_setDisplay : function(/* String */newDisplay) {
			// summary:
			// 		sets the display for the given value (or values)

			var lbl = (this.labelType === 'text' ? (newDisplay || '')
					.replace(/&/g, '&amp;').replace(/</g, '&lt;') :
					newDisplay) || this.emptyLabel;
			/*jshint laxbreak:true*/
			this.textbox.innerHTML = '<span role="option" aria-selected="true" class="dijitReset gjaxOptionElipsed dijitInline ' // /* git-qa */
					+ this.baseClass.replace(/\s+|$/g, "Label ") + '">' + lbl + '</span>';
		},
		_onFocus : function() {
			this.validate(true); // show tooltip if second focus of required tooltip, but no selection
			// Note: not calling superclass _onFocus() to avoid _KeyNavMixin::_onFocus() setting tabIndex --> -1
			//AR: after changing tamplate we need to do this (call super), so shift+tab works
			this.inherited(arguments);
		}
	});
});
