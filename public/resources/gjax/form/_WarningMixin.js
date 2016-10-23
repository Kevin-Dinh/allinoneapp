/**
 * widget			WarningTextBox
 * created			3/26/2013
 * @author	 		lzboron
 */

define([
	"dojo/_base/declare"
], function(declare) {
	return declare(null, {
		// summary:
		//		Mixin for ValidationTextBox (and inherited) that adds warning feature 
		// description:
		//		Mixin to be used with ValidationTextBox or any other inherited widgets, if we need 'warning'  feature.
		//		This featrue works similiary to classic validation. But warning message is displayed instead of error message,
		//		widget is considered to be valid, and may be submitted

		expectedPattern : null,

		// warningMessage: String
		//		The message to display if value is not expected.
		//		Set to "" to use the promptMessage instead.
		warningMessage : "$_unset_$",

		_maskExpectedSubsetWarning : true,

		_setExpectedPatternAttr : function(expectedPattern) {
			this._set("expectedPattern", expectedPattern);

			//temporarily set expectedPattern as pattern to calculate partial regexp
			//TODO should copy compute regexp instead of rewriting pattern or what?
			var pattern = this.pattern;
			var partialRe = this._partialre;
			this._set("pattern", this.expectedPattern);
			this._computeRegexp();
			this._set("_warningPartialre", this._partialre);
			this._set("pattern", pattern);
			this._set("_partialre", partialRe);
		},

		validate : function(/*Boolean*/isFocused) {
			var returnValue = this.inherited(arguments);
			if (!returnValue/* || !this.expectedPattern*/) {
				return returnValue;
			}

			var isExpected = this.disabled || this.isExpected();
			if (isExpected) {
				this._maskExpectedSubsetWarning = true;
			}
			var isExpectedSubset = !isExpected && isFocused && this._isExpectedSubset();
			this._set("state", isExpected ? "" : (((((!this._hasBeenBlurred || isFocused) && this._isEmpty(this.textbox.value)) || isExpectedSubset) && (this._maskExpectedSubsetWarning || (isExpectedSubset && !this._hasBeenBlurred && isFocused))) ? "Incomplete" : "Warning"));

			if (this.state == "Warning") {
				this._maskExpectedSubsetWarning = isFocused && isExpectedSubset;
				this.set("message", this.getWarningMessage());
			} else if (this.state == "Incomplete") {
				this._maskExpectedSubsetWarning = !this._hasBeenBlurred || isFocused;
			}

			return returnValue;
		},

		reset : function() {
			this.inherited(arguments);
			this._maskExpectedSubsetWarning = true;
		},

		isExpected : function() {
			// summary:
			//		Tests if value is expected.
			//		Can override with your own routine in a subclass.
			// tags:
			//		protected
			return !this.expectedPattern || new RegExp("^(?:" + this.expectedPattern + ")$").test(this.textbox.value);
		},

		_isExpectedSubset : function() {
			return this.textbox.value.search(this._warningPartialre) === 0;
		},

		getWarningMessage : function() {
			// summary:
			//		Return an warning message to show if appropriate
			// tags:
			//		protected
			return this.warningMessage == "$_unset_$" ? this.promptMessage : this.warningMessage;
		}
	});
});