define([
	"dojo/_base/kernel",
	"dojo/date/locale",
	"dojo/date/stamp",
	"dojo/number",
	"dojo/currency",
	"dojo/Deferred",
	"dojo/_base/lang",
	"dojo/_base/config",
	"dojo/when",
	"gjax/encoders/html/encodeSmp",
	"gjax/XString"
], function(kernel, dlocale, dateStamp, number, currency, Deferred, lang, config, when, encHtml, stringUtils) {

	var resolvedEnumSuffix = config.resolvedEnumSuffix;

	var formatters = {};

	formatters.defaultFormatter = function(value) {
		if (Object.prototype.toString.call(value) === '[object Date]') {
			return formatters.dateFormatter(value);
		}
		return value != null && value == value /*test NaN*/? encHtml(value) : "";
	};

	formatters.numberFormatter = function(value, rowIdx, cell) {
		if (value == null || value === "") {
			return "";
		}
		return number.format(value, cell && cell.constraint ? cell.constraint : null);
	};

	var dateTimeFormatterOptions = {
		formatLength : "short",
		fullYear : true
	};

	var dateFormatterOptions = lang.mixin({
		selector : "date"
	}, dateTimeFormatterOptions);

	var timeFormatterOptions = lang.mixin({
		selector : "time"
	}, dateTimeFormatterOptions);

	formatters.dateTimeFormatter = lang.partial(_dateTimeFormatter, dateTimeFormatterOptions);
	formatters.dateFormatter = lang.partial(_dateTimeFormatter, dateFormatterOptions);
	formatters.timeFormatter = lang.partial(_dateTimeFormatter, timeFormatterOptions);

	function _dateTimeFormatter(options, value, rowIdx, cell) {
		// summary:
		//		Formats dates.
		// value: String|Date
		// returns:	String
		//		Formatted date or empty string if value was not Date or ISO string.

		if (!value || value.length === 0) {
			return ""; //parsing empty string returns new Date
		}
		if (Object.prototype.toString.call(value) !== '[object Date]') {
			value = dateStamp.fromISOString(value);
		}
		options = options || {}; /*jshint expr:true */
		cell && cell.stampOptions && typeof cell.stampOptions == "object" && lang.mixin(options, cell.stampOptions);
		options.timezone = options.timezone || config.timezone;
		return value != null ? dlocale.format(value, options) : "";
	}

	formatters._dateTimeFormatter = _dateTimeFormatter; // form extending & patching

	formatters.isoDateStringFormatter = function(value) {
		kernel.deprecated("Use dateFormatter instead.");
		return formatters.dateFormatter(value);
	};

	formatters.isoDateFormatter = function(value) {
		//old temporary formatter for ptr grids
		kernel.deprecated("Use dateFormatter or deteTimeFormatter instead.");
		if (value && value.length === 10) { // date only
			return formatters.dateFormatter(value);
		} else {
			return formatters.dateTimeFormatter(value);
		}
	};

	formatters.boolFormatter = function(checked/*, object, row*/) {

		return '<div class="dijit dijitReset dijitInline dijitCheckBox dijitCheckBoxReadOnly dijitReadOnly'
				+ (!!checked ? ' dijitCheckBoxChecked dijitChecked dijitCheckBoxCheckedReadOnly dijitCheckedReadOnly' : '') + '"><input	type="checkbox"'
				+ (!!checked ? 'checked="checked"' : '') + 'class="dijitReset dijitCheckBoxInput" tabIndex="-1" /></div>';
	};

	function getResolvedFieldName(field) {
		return (stringUtils.endsWith(field, "Id") ? field.substring(0, field.length - 2) : field) + resolvedEnumSuffix;
	}

	formatters.enumFormatter = function(value, row, cell) {
		value = value != null ? value : "";
		if (value.length === 0) {
			return "";
		}
		if (typeof value == "object" && value.id == null) {
			return "";
		}

		var resolvedField = cell.resolvedField || getResolvedFieldName(cell.field);

		if (resolvedField) {
			var resValue = null;
			// check if value is (resolved) Item - defined and used by resolvedEnumEditor.js
			if (typeof value == "object" && "name" in value) {
				resValue = value.name;
			} else {
				// if not, try to find resolvedField in row's item
				var item = cell.grid.getItem ? cell.grid.getItem(row) : row;
				var valueFromItem = lang.getObject(cell.field, false, item);
				if (value == valueFromItem) { // make sure that item already has current value (may differ whe using editor.editOn)
					resValue = lang.getObject(resolvedField, false, item);
				}
			}
			if (resValue) {
				return resValue;
			}
		}

		var props = cell.widgetProps || cell.editorArgs;
		if (!props || !props.store) {
			console.error("No store found in widgetProps for field: %s in grid: %s", cell.field, cell.grid.id);
			return value;
		}

		var def = new Deferred();
		var store = props.store;
		var labelAttr = props.labelAttr || props.searchAttr;

		if (store.fetch) {
			store.fetchItemByIdentity({
				identity : value,
				onItem : function(item) {
					if (item) {
						var typeDesc = labelAttr ? store.getValue(item, labelAttr) : store.getLabel(item);
						def.resolve(typeDesc);
					} else {
						console.warn("No item found for identity: " + value);
						def.resolve("");
					}
				}
			});
		} else {
			when(store.get(value), function(item) {
				if (item) {
					def.resolve(item[labelAttr || "name"]);
				} else {
					console.warn("No item found for identity: " + value);
					def.resolve("");
				}
			});
		}
		return def;
	};

	formatters.yearMonthFormatter = function(value) {
		// summary:
		//		Formats input string/integer from YYYYMM/YYYYM to YYYY-MM/YYYY-M.
		// value: String|Integer
		// returns:	String
		//		Formatted date YYYY-MM or empty string if value was undefined or null or its length was not greater than 4.

		//covert int to string or to empty string when value is null or undefined
		value = (value) ? "" + value : "";
		//if length of string is greater than 4, format string or return ""
		value = (value.length > 4) ? value.substring(0, 4) + "-" + value.substring(4) : "";
		return value;
	};

	formatters.currencyFormatter = function(/*Number*/value, /*__FormatOptions?*/options) {
		/*=====
		currency.__FormatOptions = declare([dnumber.__FormatOptions], {
			// type: String?
			//		Should not be set.  Value is assumed to be "currency".
			// symbol: String?
			//		localized currency symbol. The default will be looked up in table of supported currencies in `dojo.cldr`
			//		A [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code will be used if not found.
			// currency: String?
			//		an [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code, a three letter sequence like "USD".
			//		For use with dojo.currency only.
			// places: Number?
			//		number of decimal places to show.  Default is defined based on which currency is used.
			type: "",
			symbol: "",
			currency: "",
			places: ""
		});
		=====*/

		return currency.format(value, options);
	};

	return formatters;
});
