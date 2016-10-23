define([
	"gjax/_base/date"
], function(gdate) {

	return {
		// summary:
		//		Set of converters for dojox/mvc/sync and at methods

		// invert: 
		//		Converter that negate value
		invert : {
			format : function(boolValue) {
				return !boolValue;
			}
		},

		// empty: 
		//		Converter that checks if array or string is empty (or null)
		empty : {
			format : function(value) {
				return !value || !value.length;
			}
		},

		/*TODO: docs not working here
		 notEmpty:
		 Converter that checks if array or string or date is NOT empty (or null) */
		notEmpty : {
			format : function(value) {
				return value && (!!value.length || gdate.isDate(value));
			}
		},

		booleanAsString : {
			format : function(value) {
				return "" + value;
			},
			parse : function(value) {
				return value == "true";
			}
		},

		nullAsNaN : {
			// mainly for NumberTextBox
			format : function(value) {
				return value === null ? NaN : value;
			},
			parse : function(value) {
				return value != value ? null : value;
			}
		},

		numberToBoolean : {
			format : function(value) {
				return value === 1;
			},
			parse : function(value) {
				return value ? 1 : 0;
			}
		}

	};
});
