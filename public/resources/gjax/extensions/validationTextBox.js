define([
	"dijit/form/ValidationTextBox",
	"gjax/log/level"
], function(ValidationTextBox, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: ValidationTextBox - added second parameter to validate function to set _hasBeenBlurred");
	var origValidate = ValidationTextBox.prototype.validate;
	
	ValidationTextBox.extend({

		validate : function(/*Boolean*/isFocused, /*Boolean*/hasBeenBlurred) {
			if (hasBeenBlurred) {
				this._hasBeenBlurred = true;
			}
			return origValidate.call(this, isFocused);
		}
	});
});
