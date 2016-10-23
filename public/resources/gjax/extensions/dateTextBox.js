define([
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/date/locale",
	"dojo/date/stamp", // stamp.fromISOString stamp.toISOString
	"dijit/form/_DateTimeTextBox",
	"dojox/form/DateTextBox",
	"gjax/log/level",
	"gjax/_base/date",
	"gjax/lang/blacklistMixin"
], function(array, lang, locale, stamp, _DateTimeTextBox, DateTextBox, level, gdate, blacklistMixin) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: DateTextBox (dojox/form) - popup class as MID allowed");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: DateTextBox (dojox/form) - sets 'forceWidth' to false");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: DateTextBox (dojox/form) - replace delimiters with local delimiter");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _DateTimeTextBox (dijit/form/) - set default value to current date");
	level("debug", "gjax/extensions")
			&& console.debug("GJAX FIX: _DateTimeTextBox (dijit/form/) - set dropdown default value to correct date (sans time if DateTextBox)");
	level("debug", "gjax/extensions")
			&& console.debug("GJAX FIX: _DateTimeTextBox (dijit/form/) - dropdown default value properly reflects dropDownDefaultValue");

	DateTextBox.extend({
		//default value to prevent setting width of popup div in dojox/form/DateTextBox by default
		//useful in situation when user sets width of the datecontrol to be smaller than minimum width of popup div for selecting date
		forceWidth : false,
		// exteded partiale from extended date and time patterns
		_partialeExtended : null,

		// change default, because dropdown width is usually smaller and it caused displaying wrong outline (box shadow)
		autoWidth : false,

		_isDefinitelyOutOfRange : function() {
			//will prevent validating dates as "11.10.201" against constraints
			//this may is still valid subset
			return false;
		},

		_computeRegexp : function(/*__Constraints*/constraints) {
			// summary:
			//		Hook to get the current regExp and to compute the partial validation RE.
			function genPattern(pattern) {
				var _partialre = "";
				pattern.replace(/\\.|\[\]|\[.*?[^\\]{1}\]|\{.*?\}|\(\?[=:!]|./g, function(re) {
					switch (re.charAt(0)) {
					case '{':
					case '+':
					case '?':
					case '*':
					case '^':
					case '$':
					case '|':
					case '(':
						_partialre += re;
						break;
					case ")":
						_partialre += "|$)";
						break;
					default:
						_partialre += "(?:" + re + "|$)";
						break;
					}
				});
				return _partialre;
			}

			// PM: compute extended partiale if not defined
			if (!this._partialeExtended) {
				var patterns = [];
				array.forEach(this._extendedDateFormats, function(datePattern) {
					array.forEach(this._extendedTimeFormats, function(timePattern) {
						patterns.push(locale.regexp({
							datePattern : datePattern,
							timePattern : timePattern
						}));
					});
					// dateTime pattern with default timePattern
					patterns.push(locale.regexp({
						datePattern : datePattern
					}));
				}, this);
				var extPartialre = array.map(patterns, genPattern);
				if (extPartialre && extPartialre.length) {
					this._partialeExtended = extPartialre.join("|");
				}
			}

			var p = this.pattern;
			if (typeof p == "function") {
				p = p.call(this, constraints);
			}
			if (p != this._lastRegExp) {
				var partialre = "";
				this._lastRegExp = p;
				// parse the regexp and produce a new regexp that matches valid subsets
				// if the regexp is .* then there's no use in matching subsets since everything is valid
				if (p != ".*") {
					partialre = genPattern(p);
				}
				try { // this is needed for now since the above regexp parsing needs more test verification
					"".search(partialre);
				} catch (e) { // should never be here unless the original RE is bad or the parsing is bad
					partialre = this.pattern;
					console.warn('RegExp error in ' + this.declaredClass + ': ' + this.pattern);
				} // should never be here unless the original RE is bad or the parsing is bad
				this._partialre = "^(?:" + partialre + ")$";
			}
			return p;
		},

		_isValidSubset : function() {
			// PM: if patialExtended, add to valid subset, else default
			return this.textbox.value.search(this._partialeExtended && this._partialeExtended ? this._partialeExtended + "|" + this._partialre
					: this._partialre) === 0;
		},

		_setConstraintsAttr : function(/*Object*/constraints) {
			// RK: Create clone to prevent editing of original constraints object
			var constr = lang.clone(constraints);

			this._addIfMissing(constr, "datePattern", this._datePattern);
			this._addIfMissing(constr, "timePattern", this._timePattern);
			this._addIfMissing(constr, "selector", this._selector || "date");
			this._addIfMissing(constr, "fullYear", true);
			this.inherited(arguments, [
				constr
			]);
		},

		_addIfMissing : function(constraints, property, value) {
			if (!(property in constraints)) {
				constraints[property] = value;
			}
		},

		_parseDate : function(value, constraints) {
			if (constraints.datePattern == "yyyy") {
				return /*undefined*/; // quick escape for years
			}

			var p, _date;

			for (p in this._extendedDateFormats || []) {
				_date = this.dateLocaleModule.parse(value, {
					datePattern : this._extendedDateFormats[p],
					selector : "date"
				});
				if (_date) {
					return this.dateLocaleModule.format(_date, constraints);
				}
			}
			return /*undefined*/;
		},

		_parseDateTime : function(value, constraints) {
			var p, _date;
			for (p in this._extendedDateFormats || []) {
				for ( var t in this._extendedTimeFormats || []) {
					_date = this.dateLocaleModule.parse(value, {
						datePattern : this._extendedDateFormats[p],
						timePattern : this._extendedTimeFormats[t]
					});
					if (_date) {
						return this.dateLocaleModule.format(_date, constraints);
					}
				}
			}
			return /*undefined*/;
		},

		_parseTime : function(value, constraints) {
			var p, _date;
			for (p in this._extendedTimeFormats || []) {
				_date = this.dateLocaleModule.parse(value, {
					selector : "time",
					timePattern : this._extendedTimeFormats[p]
				});
				if (_date) {
					return this.dateLocaleModule.format(_date, constraints);
				}
			}
			return /*undefined*/;
		},

		"parse" : function(value, constraints) {
			var _newVal;

			if (value) {
				// DATE
				if (constraints.selector == "date") {
					_newVal = this._parseDate(value, constraints);
					if (_newVal) {
						value = _newVal;
					}
				}
				// DATE_TIME
				else if (constraints.selector == "datetime") {
					// try parse dateTime, if unsuccessfull, try if date (input can be only date if user wants midnight time)
					_newVal = this._parseDateTime(value, constraints) || this._parseDate(value, constraints);
					if (_newVal) {
						value = _newVal;
					}

					// TIME
				} else if (constraints.selector == "time") {
					_newVal = this._parseTime(value, constraints);
					if (_newVal) {
						value = _newVal;
					}
				}
			}

			return this.inherited(arguments);
		},

		_setDropDownDefaultValueAttr : function(/*Date*/val) {
			if (this._isInvalidDate(val)) {
				// convert null setting into today's date, since there needs to be *some* default at all times.
				val = new this.dateClassObj();
			}
			// JU: format & parse using selector to ensure proper data (e.g. date without time)
			var constr = {
				selector : this.constraints.selector,
				fullYear : true
			};
			val = this.dateLocaleModule.parse(this.dateLocaleModule.format(val, constr), constr);
			this._set("dropDownDefaultValue", val);
		}
	});

	_DateTimeTextBox.extend({ //pkrajnik: set default value to current date

		// use origButton node from _HasDropDown.js, when arrow is hidden whole widget is set as buttonNode
		_setHasDownArrowAttr : function(/*Boolean*/val) {
			this._set("hasDownArrow", val);
			(this._origButtonNode || this._buttonNode).style.display = val ? "" : "none";
		},

		_setValueAttr : function(/*Date|String*/value, /*Boolean?*/priorityChange, /*String?*/formattedValue) {
			// summary:
			//		Sets the date on this textbox. Note: value can be a JavaScript Date literal or a string to be parsed.
			if (value !== undefined) {
				if (typeof value == "string" && value !== "") {
					value = stamp.fromISOString(value);
				}
				if (this._isInvalidDate(value)) {
					value = null;
				}
				if (value instanceof Date && !(this.dateClassObj instanceof Date)) {
					value = new this.dateClassObj(value);
				}
			}
			this.inherited(arguments, [
				value,
				priorityChange,
				formattedValue
			]);
			if (this.value instanceof Date) {
				this.filterString = "";
			}
			if (priorityChange !== false && this.dropDown && this.dropDown.get("value") != value) {
				this.dropDown.set('value', value, false);
			}
		},

		openDropDown : function(/*Function*//*callback*/) {
			// rebuild drop down every time, so that constraints get copied (#6002)
			if (this.dropDown) {
				this.dropDown.destroy();
			}
			var PopupProto = lang.isString(this.popupClass) ? lang.getObject(this.popupClass, false) : this.popupClass, textBox = this, value = this
					.get("value");

			this.dropDown = new PopupProto({
				onChange : function(value) {
					// JU: format & parse using selector to ensure proper data (e.g. date without time)
					var constr = {
						selector : textBox.constraints.selector,
						fullYear : true
					};
					value = textBox.dateLocaleModule.parse(textBox.dateLocaleModule.format(value, constr), constr);
					// this will cause InlineEditBox and other handlers to do stuff so make sure it's last
					textBox.set('value', value, true);
				},
				id : this.id + "_popup",
				dir : textBox.dir,
				lang : textBox.lang,
				value : value,
				defaultValue : this.dropDownDefaultValue, // JU: used to initialize popup
				textDir : textBox.textDir,
				currentFocus : this.dropDownDefaultValue, // JU: TODO remove this, currentFocus is not used in dojox Calendars popups
				constraints : textBox.constraints,
				filterString : textBox.filterString, // for TimeTextBox, to filter times shown
				datePackage : textBox.datePackage,
				isDisabledDate : function(/*Date*/date) {
					// PM use custom range check, dates should be always valid, basic compare should be enough
					// replaced textBox.rangeCheck(date, constr)
					function customRangeCheck(d, constraints, selector) {
						return ("min" in constraints ? (gdate.compare(d, constraints.min, selector) >= 0) : true)
								&& ("max" in constraints ? (gdate.compare(d, constraints.max, selector) <= 0) : true); // Boolean
					}
					// summary:
					//		disables dates outside of the min/max of the _DateTimeTextBox
					//		disables days inside of the disabledDays of the _DateTimeTextBox, [ Sunday - 0 ... Saturday - 6]
					var constr = lang.clone(textBox.constraints);
					// mjanos: disable time part of date: setting max/min possible time of min/max constraints only for rangeCheck function
					if (constr.min) {
						constr.min.setHours(0, 0, 0);
					}
					if (constr.max) {
						constr.max.setHours(23, 59, 59);
					}

					return !customRangeCheck(date, constr, textBox._selector)
							|| (constr.disabledDays && ~array.indexOf(constr.disabledDays || [], (date || new Date()).getDay()));
				}
			});

			this.inherited(arguments);
		},

		_formatConstraints : function(constraints) {
			// format min/max - see extensions/rangeBoundTextBox
			var ret = blacklistMixin([
				"min",
				"max"
			], {}, constraints);
			"min" in constraints && (ret.min = this.dateLocaleModule.format(constraints.min, constraints));
			"max" in constraints && (ret.max = this.dateLocaleModule.format(constraints.max, constraints));
			return ret;
		}

	});
});
