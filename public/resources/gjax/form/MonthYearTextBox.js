define([
	"dojo/_base/declare",
	"dojox/form/DateTextBox",
	"dojo/i18n!dojo/cldr/nls/gregorian",
	"dojox/widget/MonthAndYearlyCalendar"
], function(declare, DateTextBox, gregorian, MonthAndYearlyCalendar) {

	return declare(DateTextBox, {

		popupClass : MonthAndYearlyCalendar,
		_datePattern : gregorian["dateFormatItem-yM"]
	});

});