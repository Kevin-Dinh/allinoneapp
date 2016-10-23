define([
	"dojo/_base/declare",
	"dojox/form/DateTextBox",
	"dojox/widget/DailyCalendar"
], function(declare, DateTextBox, DailyCalendar) {

	return declare(DateTextBox, {

		popupClass : DailyCalendar,
		_datePattern : "d"
	});

});