define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dijit/form/ValidationTextBox",
	"dojo/_base/array",
	"gjax/collections/compare",
	"dojo/i18n!./nls/RangeListTextBox",
	"dojo/string"
], function(declare, lang, ValidationTextBox, array, compare, i18n, string) {

	// module:
	//		gjax/form/RangeListTextBox

	return declare(ValidationTextBox, {
		// summary:
		//		RangeListTextBox is textbox that allows user to specify list of ranges. Ranges are separated by coma. Range can be represented by single number
		//		or two numbers separated by -. If range is specified by two numbers, first one must be lesser or equal than second one. 

		// parsedValue:
		//		Array of all unique numbers from specified ranges.
		parsedValue : null,

		pattern : "(?:(?:\\s*\\d+\\s*(?:-\\s*\\d*\\s*)?)\\s*,\\s*)*(?:(?:\\s*\\d+\\s*(?:-\\s*\\d*\\s*)?)\\s*,?\\s*)?",

		isValid : function() {
			this.rangeError = false;
			var isValid = this.inherited(arguments);
			var value = this.get("value");
			if (!isValid || !value) {
				return isValid;
			}
			var ranges = value.split(",");
			return array.every(ranges, function(range) {
				var match = range.trim().match(/(\d+)-?(\d+)?/);
				if (!match) {
					return true;
				} else if (match[2] == null) {
					if (isNaN(match[1])) {
						return false;
					}
					if (this.constraints) {
						if (this.constraints.min != null && +match[1] < this.constraints.min) {
							this.rangeError = true;
							return false;
						}
						if (this.constraints.max != null && +match[1] > this.constraints.max) {
							this.rangeError = true;
							return false;
						}
						return true;
					}
					return true;
				} else {
					if (+match[2] < +match[1]) {
						return false;
					}
					if (this.constraints) {
						if (this.constraints.min != null && +match[1] < this.constraints.min) {
							this.rangeError = true;
							return false;
						}
						if (this.constraints.max != null && +match[2] > this.constraints.max) {
							this.rangeError = true;
							return false;
						}
						return true;
					}
					return true;
				}
			}, this);
		},

		getErrorMessage : function() {
			if (this.rangeError) {
				if (this.constraints.min != null && this.constraints.max != null) {
					return string.substitute(i18n.invalidRange, [
						this.constraints.min,
						this.constraints.max
					]);
				} else if (this.constraints.max != null) {
					return string.substitute(i18n.invalidMaxRange, [
						this.constraints.max
					]);
				} else if (this.constraints.min != null) {
					return string.substitute(i18n.invalidMinRange, [
						this.constraints.min
					]);
				}
			} else {
				return this.inherited(arguments);
			}
		},

		_setValueAttr : function() {
			this.inherited(arguments);
			this.parseValue();
		},

		parseValue : function() {
			if (!this.isValid()) {
				return null;
			}
			var value = this.get("value");
			var ranges = value.split(",");
			var parsedValue = [];
			array.forEach(ranges, function(range /*, index, ranges*/) {
				var match = range.trim().match(/(\d+)-?(\d+)?/);
				if (!match) {
					return;
				} else if (match[2] == null) {
					if (array.indexOf(parsedValue, +match[1]) == -1) {
						parsedValue.push(+match[1]);
					}
				} else {
					for (var i = +match[1]; i <= match[2]; i++) {
						if (array.indexOf(parsedValue, i) == -1) {
							parsedValue.push(i);
						}
					}
				}
			}, this);
			this._set("parsedValue", parsedValue);
		},

		_setParsedValueAttr : function(parsedValue) {
			var value = "";
			var lastNum, inRange = false;
			parsedValue.sort(compare.simple);
			array.forEach(parsedValue, function(parsedNum, index) {
				if (lastNum == null) {
					value += parsedNum;
					lastNum = parsedNum;
				} else if ((parsedNum == lastNum + 1 || parsedNum == lastNum) && !inRange) {
					value += "-";
					inRange = true;
					lastNum = parsedNum;
				} else if (parsedNum == lastNum + 1 || parsedNum == lastNum) {
					lastNum = parsedNum;
				} else if (inRange) {
					value += lastNum + "," + parsedNum;
					inRange = false;
					lastNum = parsedNum;
				} else {
					value += "," + parsedNum;
					lastNum = parsedNum;
				}
				if (inRange && index == parsedValue.length - 1) {
					value += parsedNum;
				}
			});
			this._set("parsedValue", parsedValue);
			this.set("value", value);
		}
	});
});
