/*jshint expr:true */
define([
	"dojo/date",
	"dojo/date/stamp",
	"dojo/date/locale",
	"gjax/_base/kernel"
], function(ddate, dstamp, locale, gkernel) {

	var toString = Object.prototype.toString;

	var param = function(d) {
		return (typeof d == "string") ? dstamp.fromISOString(d) : d;
	};

	var _dateFormats = /[GyQqMLwdDecE]/; // whitelists from dojo/date/locale
	var _timeFormats = /[ahHKkmsS]/;
	var _dateTimeFormat = /^([GyQqMLwdDecEahHKkmsS]|[^a-zA-Z])+$/;
	var isPattern = function(pattern) {
		// crude test - only certain letters are allowed, at least one letter must be present
		return pattern && _dateTimeFormat.test(pattern) && pattern.replace(/[^a-z]/gi, "").length;
	};
	var format = function(d, pattern) {
		var selector = (_dateFormats.test(pattern) ? "date" : "") + (_timeFormats.test(pattern) ? "time" : "");
		gkernel.asrt(selector !== "", "Unknown date/time pattern " + pattern);
		return locale.format(d, {
			selector : selector,
			datePattern : pattern
		});
	};

	// summary:
	//		Date utilities.

	return {
		isDate : function(d) {
			// summary:
			//		Check if something is Date.
			//		Eliminates cross-window issues.
			// d: Any
			//		something to check
			// returns:	boolean
			//		for valid date, NaN dates are threated as false
			return (typeof d == "object" && toString.call(d) == "[object Date]" && +d === +d);
		},
		today : function() {
			// summary:
			//		Returns current date with time set to midnight (honoring timezone).
			return dstamp.fromISOString(this.toISOString("date", new Date()));
		},
		toISOString : function(selector, value) {
			// summary:
			//		Convert date string or object to ISO format.
			// selector: String
			//		Identify date-time part to select.
			// value: String|Date
			//		Date to convert to ISO format.
			// returns: Any
			//		for valid date returns date ISO format.
			if (value === undefined) {
				// shift args
				value = selector;
				selector = "datetime";
			} else if (!value) {
				return value;
			}
			var options = {
				zulu : false,
				milliseconds : true,
				selector : selector
			};
			if (typeof value == "string") {
				var date = dstamp.fromISOString(value);
				// invalid date, returns unchanged value
				return date && dstamp.toISOString(date, options);
			} else if (value instanceof Date) {
				return dstamp.toISOString(value, options);
			}
			return value;
		},
		compare : function(date1, date2, portion) {
			// summary:
			//		Compare two dates by date, time, or both.
			// description:
			//		Works for date objects, ISO dates and combinations.
			//		Returns 0 if equal, positive if `date1` &gt; `date2`, else negative.
			// date1: Date|String
			//		Date.
			// date2: Date|String?
			//		Date. If not specified, the current Date is used.
			// portion: String?
			//		A string indicating the "date" or "time" portion of a Date object.
			//		Compares both "date" and "time" by default. 
			//		One of the following: "date", "time", "datetime".
			//		Optionally this can also be formatting pattern, when string representations of dates need to be compared.
			// example:
			//	|	var d1 = new Date(2001, 5, 6);
			//	|	var d2 = "2006-05-06";
			//	|	gdate.compare(d1, d2); // -1
			//	|	gdate.compare(d1, d2, "MM.dd.") // 0, year is ignored

			if (!portion || (/date(time)?|time/).test(portion) || !isPattern(portion)) {
				// use dojo
				return ddate.compare(param(date1), param(date2), portion);
			} else {
				// format (portion is really a pattern) and compare strings
				date1 = format(param(date1), portion);
				date2 = format(param(date2), portion);
				return date1 > date2 ? 1 : (date1 < date2 ? -1 : 0);
			}

		},
		greatest : function(date1, date2, portion) {
			// summary:
			//		Returns greatest date from two dates by comparing date, time, or both.
			// description:
			//		Works for date objects, ISO dates and combinations.
			//		Returns greatest, if equal returns second or first (if invalid date format).
			// date1: Date|String
			//		Date.
			// date2: Date|String
			//		Date.
			// portion: String?
			//		A string indicating the "date" or "time" portion of a Date object.
			//		Compares both "date" and "time" by default. 
			//		One of the following: "date", "time", "datetime".
			//		Optionally this can also be formatting pattern, when string representations of dates need to be compared.
			return this.compare(date1, date2, portion) > 0 ? date1 : (param(date2) ? date2 : date1);
		},
		equals : function(date1, date2, portion) {
			// summary:
			//		Test two dates for equality.
			// description:
			//		Works for date objects, ISO dates and combinations.
			// date1: Date|String
			//		Date.
			// date2: Date|String
			//		Date.
			// portion: String?
			//		A string indicating the "date" or "time" portion of a Date object.
			//		Tests both "date" and "time" by default. 
			//		One of the following: "date", "time", "datetime".
			//		Optionally this can also be formatting pattern, when string representations of dates need to be compared
			//		(see gdate.compare)
			return date1 == date2 || ((date1 == null || date2 == null) ? false : !this.compare(date1, date2, portion));
		},
		inRange : function(date, start, end, portion) {
			// summary:
			//		Test if date falls to specified date range (inclusive).
			// description:
			//		Works for date objects, ISO dates and combinations.
			// date: Date|String
			//		Date.
			// start: Date|String?
			//		Range start (inclusive). If not specified, the current Date is used.
			// end: Date|String?
			//		Range end (inclusive). If not specified, the current Date is used.
			// portion: String?
			//		A string indicating the "date" or "time" portion of a Date object.
			//		Tests both "date" and "time" by default. 
			//		One of the following: "date", "time", "datetime".
			var _date = param(date);
			return ddate.compare(_date, param(start), portion) >= 0 && (end == null || ddate.compare(_date, param(end), portion) <= 0);
		},
		difference : function(date1, date2, interval) {
			// summary:
			//		Get the difference in a specific unit of time (e.g., number of
			//		months, weeks, days, etc.) between two dates, rounded to the
			//		nearest integer.
			// description:
			//		Works for date objects, ISO dates and combinations.
			// date1: Date|String
			//		Date.
			// date2: Date|String?
			//		Date. If not specified, the current Date is used.
			// interval:
			//		A string representing the interval. One of the following:
			//		"year", "month", "day", "hour", "minute", "second",
			//		"millisecond", "quarter", "week", "weekday".
			//
			//		Defaults to "day".
			return ddate.difference(param(date1), param(date2), interval);
		}
	};
});