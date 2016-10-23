define([
	"dojo/_base/declare",
	"dojox/form/DateTextBox",
	"dojox/widget/YearlyCalendar"
], function(declare, DateTextBox, YearlyCalendar) {

	return declare(DateTextBox, {
		popupClass : YearlyCalendar,
		_datePattern : "yyyy"
	});

});