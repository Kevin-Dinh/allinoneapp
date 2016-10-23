define([
	"dojo/_base/declare",
	"dojox/widget/_CalendarBase",
	"./_CalendarTime",
	"dojox/widget/_CalendarDay",
	"dojox/widget/_CalendarMonthYear"
], function(declare, _CalendarBase, _CalendarTime, _CalendarDay, _CalendarMonthYear) {

	return declare([
		_CalendarBase,
		_CalendarTime,
		_CalendarDay,
		_CalendarMonthYear
	], {
	// summary:
	//		A Calendar with 3 panes, firts for date, second for day and the third one containing both month and year
	// description:
	//		Popup class for dojox/form/DateTextBox (and descendatns). 
	//		(used by gjax/form/DateTimeTextBox)

	});
});