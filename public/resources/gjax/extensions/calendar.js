define([
	"dojo/_base/connect",
	"dojo/_base/lang",
	"dojo/_base/event",
	"dojo/html",
	"dojo/text!./templates/CalendarMonthYearView.html",
	"dojo/query",
	"dojo/date",
	"dojo/dom-class",
	"dojo/date/locale",
	"dojo/cldr/supplemental",
	"dojo/i18n!./nls/common",
	"dojo/i18n!dijit/nls/common",
	"dojox/widget/_CalendarMonthYearView",
	"dojox/widget/_CalendarDayView",
	"dojox/widget/_CalendarBase",
	"dijit/_CssStateMixin",
	"gjax/encoders/html/encodeSmp",
	"gjax/log/level"
], function(connect, lang, event, html, calendarMonthYearViewtTempalte, query, dojoDate, domClass, locale, supplemental, i18n, i18nDijit,
		CalendarMonthYearView, CalendarDayView, CalendarBase, _CssStateMixin, encHtml, level) {

	var daysOfWeek = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday"
	];

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: DateTextBox (dojox/form) - localize and format(unlocalized) 'Today'");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: DateTextBox - enable null value, and choosing current date");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: DateTextBox - disable slide calendar into section that is not allowed by constraints");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: DateTextBox - special class added on each week day");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: DateTextBox - can be initialized to value other than new Date");

	var origPostCreate = CalendarBase.prototype.postCreate;
//	var origOnDateSelected = CalendarBase.prototype._onDateSelected;
	CalendarBase.extend({
		postCreate : function() {
			lang.hitch(this, origPostCreate)(arguments);
			html.set(this.footer, encHtml(i18n.today + ": " + locale.format(new Date(), {
				formatLength : this.footerFormat,
				selector : "date",
				fullYear : true,
				locale : this.lang
			})));
		},
		_setValueAttr : function(/*Date*/value) {
			// summary:
			//      Set the current date and update the UI. If the date is disabled, the selection will
			//      not change, but the display will change to the corresponding month.
			//		arakovsky: this condition is moved up to achieve same behaviour as dijit/DateTextBox (allow to delete value)
			if (this._isInvalidDate(value)) {
				this._hasInvalidDate = true; //enable set current date
				//assign new date to value, so when drop down is opened, current date is selected
				this.value = this.defaultValue || new Date(); // JU: defaultDate can be used instead of new Date()
				return false;
			}
			if (!value) {
				value = new Date();
			}
			if (!value["getFullYear"]) {
				value = dojoDate.stamp.fromISOString(value + "");
			}
			// AR: set new value, only if it is different from current, or flag '_hasInvalidDate' is true 
			// (this will allow to set current date, which is also in this.value if previous value was invalid)
			if (this._hasInvalidDate || dojoDate.compare(value, this.value)) {
				value = new Date(value);
				this.displayMonth = new Date(value.getTime());
				this._internalValue = value;
				if (!this.isDisabledDate(value, this.lang) && this._currentChild === 0) {
					this._hasInvalidDate = false; // stop recursive set; keep this flag until child 0
					this.value = value;
					this.onChange(value);
				}
				if (this._children && this._children.length > 0) {
					this._children[this._currentChild].set("value", this.value);
				}
				return true;
			}
			//arakovsky: added condition - to fix not working 'ok' button for situation when year/month is not changed
			if (this._currentChild === 0) {
				this.onExecute();
			}
			return false;
		},

		postMixInProperties : function() {
			this.inherited(arguments);
			//AR: This code is useless, any value passed to constructor will be processed by _setValueAttr
			//this.value = this.parseInitialValue(this.value);
		},

		getClassForDate : function(/*Date*/dateObject/*, String? locale*/) {
			return "dijitCalendar" + daysOfWeek[dateObject.getDay()] + "Date";
		},

		_adjustDisplay : function(/*String*/part, /*int*/amount/*, noSlide*/) {
			// summary:
			//		This function overrides the base function defined in dijit/Calendar.
			//		It changes the displayed years, months and days depending on the inputs.
			var child = this._children[this._currentChild];
			var adjMonth = child.adjustDate(this.displayMonth, amount);
			//MR: disable moving into area, which is not allowed by constraints
			//MH: compute proper constraint for month to prevent horizontal scroll bug where user could not slide to next month with enabled days  
			var compareDate;
			if (part === "month") {
				compareDate = lang.clone(this.displayMonth);
				compareDate.setDate(1);
				if (!!~amount) { //check first day of next month when "sliding to right"
					compareDate.setMonth(compareDate.getMonth() + 1);
				} else { //else check last day of previous month (sliding to left)
					compareDate.setDate(compareDate.getDate() - 1);
				}
			}
			if (this.isDisabledDate(compareDate || adjMonth, this.lang)) {
				return;
			}

			var month = this.displayMonth = adjMonth;

			this._slideTable(child, amount, function() {
				child.set("value", month);
			});
		},

		//@stakac: goToMonth - set displayMonth do newMonth
		goToMonth : function(newMonth) {
			var displayMonth = this.displayMonth;
			var amount = (newMonth.getFullYear() - displayMonth.getFullYear()) * 12 + (newMonth.getMonth() - displayMonth.getMonth());
			if (amount) {
				var child = this._children[this._currentChild];
				var adjMonth = child.adjustDate(this.displayMonth, amount);
				var month = this.displayMonth = adjMonth;
				child.set("value", month);
			}
		},

		//@stakac: goBetweenConstrains - set displayMonth between constraints
		goBetweenConstraints : function() {
			var displayMonth = this.displayMonth;
			var constraints = this.get('constraints');
			if (constraints) {
				var min = constraints.min;
				if (min && displayMonth < min) {
					this.goToMonth(min);
				}
				var max = constraints.max;
				if (max && max < displayMonth) {
					this.goToMonth(max);
				}
			}
		},

		goToToday : function() {
			var today = new Date();
			//MR: disable moving into area, which is not allowed by constraints
			if (this.isDisabledDate(today, this.lang)) {
				return;
			}

			//PM format & parse using selector to ensure proper data (e.g. date without time)
			var constr = {
				selector : this.constraints.selector
			};
			today = locale.parse(locale.format(today, constr), constr);

			this.set("value", today);
			this.onValueSelected(this.get('value'));
		}
	});

	var origPostCreateDayView = CalendarDayView.prototype.postCreate;
	CalendarDayView.extend({
		postCreate : function() {
			origPostCreateDayView.call(this, arguments);
			var dayOffset = supplemental.getFirstDayOfWeek(this.getLang());
			query(".dijitCalendarDayLabel", this.domNode).forEach(function(labelNode, i) {
				domClass.add(labelNode, "dijitCalendar" + daysOfWeek[(i + dayOffset) % 7] + "DateLabel");
			}, this);
		},
		onDisplay : function() {
			//@stakac: set defaultly displaied month between constraints:
			this.parent.goBetweenConstraints && this.parent.goBetweenConstraints();
			this.inherited(arguments/*, [new, arguments]*/);
		}
	});

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Localization added to ok & cancel buttons");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Button theme added to ok & cancel buttons (also css state mixin for hover efects)");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: Cancel button now works correctly, iv this is the only view (MonthYearTextBox)");
	CalendarMonthYearView.extend(_CssStateMixin.prototype);
	CalendarMonthYearView.extend({
		templateString : calendarMonthYearViewtTempalte,
		cancelBtnLabel : i18nDijit.buttonCancel,
		okBtnLabel : i18nDijit.buttonOk,

		postCreate : function() { // taken from `dojox/widget/_CalendarMonthYearView`
			this.cloneClass(".dojoxCal-MY-G-Template", 5, ".dojoxCal-MY-btns");
			this.monthContainer = this.yearContainer = this.myContainer;

			var yClass = "dojoxWidgetCalendarYearLabel";
			var dClass = "dojoxWidgetCalendarDecrease";
			var iClass = "dojoxWidgetCalendarIncrease";

			query("." + yClass, this.myContainer).forEach(function(node, idx) {
				var clazz = iClass;
				switch (idx) {
				case 0:
					clazz = dClass;
					/* falls through */
				case 1:
					domClass.remove(node, yClass);
					domClass.add(node, clazz);
					break;
				}
			});
			// Get the year increment and decrement buttons.
			this._decBtn = query('.' + dClass, this.myContainer)[0];
			this._incBtn = query('.' + iClass, this.myContainer)[0];

			query(".dojoxCal-MY-M-Template", this.domNode).filter(function(item) {
				return item.cellIndex == 1;
			}).addClass("dojoxCal-MY-M-last");

			connect.connect(this, "onBeforeDisplay", lang.hitch(this, function() {
				this._cachedDate = new Date(this.get("value").getTime());
				//@stakac commented following line:
				//this._populateYears(this._cachedDate.getFullYear());
				this._populateMonths();
				this._updateSelectedMonth();
				this._updateSelectedYear();
			}));

			connect.connect(this, "_populateYears", lang.hitch(this, function() {
				this._updateSelectedYear();
			}));
			connect.connect(this, "_populateMonths", lang.hitch(this, function() {
				this._updateSelectedMonth();
			}));

			this._cachedDate = this.get("value");

			this._populateYears();
			this._populateMonths();

			// Add visual effects to the view, if any have been mixed in
			this.addFx(".dojoxWidgetCalendarMonthLabel,.dojoxWidgetCalendarYearLabel ", this.myContainer);
		},

		_populateYears : function(year) {
			// summary:
			//		Fills the list of years with a range of 12 numbers, with the current year
			//		being the 6th number.

			var match, constraints = this.get('constraints'), thisYear = this.get("value").getFullYear(), dispYear = year || thisYear, firstYear = dispYear
					- Math.floor(this.displayedYears / 2), minFull = constraints && constraints.min ? constraints.min.getFullYear() : firstYear - 10000;

			this._displayedYear = dispYear;

			var yearLabels = query(".dojoxWidgetCalendarYearLabel", this.yearContainer);

			var max = constraints && constraints.max ? constraints.max.getFullYear() - firstYear : yearLabels.length;
			var min = minFull - firstYear;
			var disabledClass = 'dijitCalendarDisabledDate';
			var today;
			yearLabels.forEach(lang.hitch(this, function(node, cnt) {
				// @stakac modified original code:
				// `if(cnt <= max){
				//	this._setText(node, firstYear + cnt);
				// }`
				// use that command without condition, because that condition makes confusions...
				this._setText(node, firstYear + cnt);
				today = (firstYear + cnt) == thisYear;
				domClass.toggle(node.parentNode, [
					"dijitCalendarSelectedDate",
					"dijitCalendarCurrentDate"
				], today);
				// @stakac: add `disabledClass` also for years less than min
				domClass.toggle(node, disabledClass, cnt > max || cnt < min);
				match = (firstYear + cnt) == thisYear;
				domClass.toggle(node.parentNode, [
					"dijitCalendarSelectedDate",
					"dijitCalendarCurrentDate"
				], match);
			}));

			if (this._incBtn) {
				domClass.toggle(this._incBtn, disabledClass, max < yearLabels.length);
			}
			if (this._decBtn) {
				domClass.toggle(this._decBtn, disabledClass, minFull >= firstYear);
			}

			var h = this.getHeader();
			if (h) {
				this._setText(this.getHeader(), firstYear + " - " + (firstYear + 11));
			}
		},

		onCancel : function(evt) {
			event.stop(evt);
			//AR: if this is firts child, do not call onValueSelected
			if (this.parent._currentChild === 0) {
				this.parent.onExecute();
			} else {
				this.onValueSelected(this.get("value"));
			}
			return false;
		},

		startup : function() {
			if (this._started) {
				return;
			}
			this.inherited(arguments/*, [new, arguments]*/);

			this._trackMouseState(this.okBtn, "dijitButton");
			this._trackMouseState(this.cancelBtn, "dijitButton");
		}
	});
});