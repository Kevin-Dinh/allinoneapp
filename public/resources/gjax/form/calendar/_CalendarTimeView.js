define([
	"dojo/_base/declare",
	"dojox/widget/_CalendarView",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/_CssStateMixin",
	"dojo/text!./templates/CalendarTimeView.html",
	"dojo/html",
	"dojo/date/locale",
	"dijit/typematic",
	"dojo/_base/event",
	"gjax/_base/date",
	"dojo/i18n!dojo/cldr/nls/gregorian",
	"dojo/_base/lang",
	"dojo/date",
	"dojo/i18n!dijit/nls/common",
	"dojo/i18n!../nls/CalendarTimeView",
	"dojo/dom-style",
	"gjax/encoders/html/encodeSmp",
	"dijit/form/HorizontalSlider",
	"dijit/form/TimeTextBox"
], function(declare, _CalendarView, _TemplatedMixin, _WidgetsInTemplateMixin, _CssStateMixin, templateString, html, locale, typematic, event, gdate, //
gregorian, lang, dojoDate, i18nDijitCommon, i18nTimeView, domStyle, encHtml) {
	return declare([
		_CalendarView,
		_TemplatedMixin,
		_WidgetsInTemplateMixin,
		_CssStateMixin
	], {
		// summary:
		//		View class for the dojox/widget/Calendar.
		//		Adds a time view

		templateString : templateString,

		i18n : lang.mixin({}, i18nDijitCommon, i18nTimeView),

		useHeader : false, // we don't use dafault month-changing header, this view has its own day-changing header

		buildRendering : function() {
			this.inherited(arguments);
			var constraints = this.parent.constraints;
			this.timeTextBox.set("constraints", lang.mixin({}, this.timeTextBox.get("constraints"), {
				timePattern : constraints.timePattern
			}));
			if (!constraints.showSeconds) {
				domStyle.set(this.secondsRow, "visibility", "hidden");
			}
		},

		startup : function() {
			this.inherited(arguments);

			this.hoursSpinner.on("change", lang.hitch(this, "_updateTB", "Hours"));
			this.minutesSpinner.on("change", lang.hitch(this, "_updateTB", "Minutes"));
			this.secondsSpinner.on("change", lang.hitch(this, "_updateTB", "Seconds"));
			this.timeTextBox.on("change", lang.hitch(this, "_updateSliders"));

			// handlers for custom day-changing header
			this._hookDaySliderHandler(this.incrementDay, 1);
			this._hookDaySliderHandler(this.decrementDay, -1);

			this._trackMouseState(this.okBtn, "dijitButton");
			this._trackMouseState(this.cancelBtn, "dijitButton");
		},

		//inspired by calendarBase
		_hookDaySliderHandler : function(node, adj) {
			typematic.addMouseListener(node, this, function(count) {
				if (count >= 0) {
					this._adjustHeader(adj);
				}
			}, 0.8, 500);
		},

		onOk : function(evt) {
			event.stop(evt);
			this.onValueSelected(this.get("value"));
			return false;
		},

		onCancel : function(evt) {
			event.stop(evt);
			if (this.parent._currentChild === 0) {
				this.parent.onExecute();
			}
			return false;
		},

		onHeaderClick : function() {
			this.parent._transitionVert(1);
		},

		_adjustHeader : function(adj) {
			var date = dojoDate.add(this.get("value"), "day", adj);
			if (this.isDisabledDate(date, this.lang)) {
				return;
			}
			// month may have changed, update it
			this.parent._internalValue = this.parent.displayMonth = date;
			this._populateTime(date);
		},

		_updateTB : function(timePart, value) {
			if (value == null) { //this is set when invalid date is set to textbox
				return;
			}
			var time = this.timeTextBox.get("value");
			if (!gdate.isDate(time)) {
				time = this.get("value");
				time.setHours(0, 0, 0);
			}
			time["set" + timePart](value);
			this.timeTextBox.set("value", time);
			this._updateParentTime(time);
		},

		_updateSliders : function(time) {
			var hours = null, minutes = null, seconds = null;
			if (gdate.isDate(time)) {
				hours = time.getHours();
				minutes = time.getMinutes();
				seconds = time.getSeconds();
				this._updateParentTime(time);
			}
			this.hoursSpinner.set("value", hours);
			this.minutesSpinner.set("value", minutes);
			this.secondsSpinner.set("value", seconds);
		},

		_updateParentTime : function(time) {
			var date = this.get("value");
			date.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
			this.parent._internalValue = date;
		},

		_setValueAttr : function() {
			//getter is redirected to parent, so we do not need call _set
			this._populateTime();
		},

		_populateTime : function(date) {
			// summary:
			//		Fills the days of the current month.

			date || (date = this.get("value"));
			html.set(this.headerDate, encHtml(locale.format(date, {
				selector : "date",
				formatLength : "short"
			})));
			this.timeTextBox.set("value", date);
		}
	});
});