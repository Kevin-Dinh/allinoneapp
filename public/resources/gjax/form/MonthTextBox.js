define([
	"dojo/_base/declare",
	"dojox/form/DateTextBox",
	"dojox/widget/MonthlyCalendar"
], function(declare, DateTextBox, MonthlyCalendar) {

	return declare(DateTextBox, {

		popupClass : MonthlyCalendar,
		_datePattern : "LLLL",

		"parse" : function(/*String*/value/*, locale.__FormatOptions constraints*/) {
			// summary:
			//		Parses as string as a Date, according to constraints
			// tags:
			//		protected

			return this.dateLocaleModule.parse(value, {
				datePattern : "M",
				selector : "date"
			}) || this.inherited(arguments);
		}
	});

});