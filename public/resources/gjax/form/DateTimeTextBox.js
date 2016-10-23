define([
	"dojo/_base/declare",
	"dojox/form/DateTextBox",
	"./calendar/DateTimeCalendar",
	"dojo/i18n!dojo/cldr/nls/gregorian"
], function(declare, DateTextBox, DateTimeCalendar, gregorian) {

	return declare(DateTextBox, {
		// summary:
		//		A validating, serializable, range-bound date text box with a popup calendar 
		//		that contains time view beside standard (dojox) day & year/month views.

		popupClass : DateTimeCalendar,

		// hideSeconds: [const] Boolean
		//		Format and parse time without seconds & do not display seconds slider
		showSeconds : false,

		postMixInProperties : function() {
			//this must be applied before setters are called (setter of constraint will take _timePatters)
			//_setConstraintsAttr is called in postMixin of ValidationTexbox, so call this inherited after our code
			this._timePattern = this._timePattern || gregorian[this.showSeconds ? "timeFormat-medium" : "timeFormat-short"];
			this.constraints.showSeconds = this.showSeconds;

			this.inherited(arguments);
		},

		_selector : "datetime",
		_datePattern : gregorian["dateFormat-medium"],
		_timePattern : null
	});

});