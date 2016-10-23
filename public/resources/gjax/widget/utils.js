define([
	"dojox/lang/functional",
	"dojo/_base/lang",
	"dojo/i18n!./nls/utils",
	"dojo/date/stamp",
	"dojo/string"
], function(df, lang, i18n, dstamp, string) {

	// summary:
	//		Various widget utils

	var DEFAULT_CONSTRAINTS = {
		constraints : {},
		rangeMessage : "$_unset_$"
	};

	function ensureRequirement(source, target, both) {
		// summary:
		//		Method setup watching of value on source, and makes target required, if value is not null.
		//		If both param is set to true, watching is made also in other direction

		var handles = [];
		// set costraints if source already has value
		setRequired(target, "value", null, source.get("value"));
		// ensure that future changes of source value will update counstraints
		handles.push(source.watch("value", lang.partial(setRequired, target)));

		if (both) {
			setRequired(source, "value", null, target.get("value"));
			handles.push(target.watch("value", lang.partial(setRequired, source)));
		}
		return {
			remove : function() {
				df.forEach(handles, "h.remove()");
			}
		};
		function setRequired(w, name, old, current) {
			w.set("required", current != null && current == current);
		}
	}

	function _ensureInterval(valueToConstraintsFn, defaultRangeMessageCode, fromW, toW, rangeMessage) {
		// summary:
		//		Ensures proper dynamic constraints for two fields

		rangeMessage = rangeMessage || string.substitute(i18n[defaultRangeMessageCode], [
			toW.get("columnLabel") || toW.get("title") || toW.get("label"),
			fromW.get("columnLabel") || fromW.get("title") || fromW.get("label")
		]);

		fromW.set("rangeMessage", rangeMessage);
		toW.set("rangeMessage", rangeMessage);

		var handles = [
			_setupConstraints(fromW, toW, "min", valueToConstraintsFn),
			_setupConstraints(toW, fromW, "max", valueToConstraintsFn)
		];

		return {
			remove : function() {
				df.forEach(handles, "h.remove()");
				fromW.set(lang.clone(DEFAULT_CONSTRAINTS));
				toW.set(lang.clone(DEFAULT_CONSTRAINTS));
			}
		};

		function _setupConstraints(source, target, targetConstraint, valueToConstraintsFn) {
			// set costraints if source already has value
			target.set("constraints", valueToConstraintsFn(source.get("value"), targetConstraint, target));

			// ensure that future changes of source value will update counstraints
			return source.watch("value", function(prop, old, value) {
				target.set("constraints", valueToConstraintsFn(value, targetConstraint, target));
			});
		}
	}

	function dateValueToConstraints(value, targetConstraint, target) {
		var newConstraints = dateTimeValueToConstraints("date", value, targetConstraint, target);
		var dateValue = newConstraints[targetConstraint];
		if (dateValue) {
			var isMin = targetConstraint == "min";
			dateValue.setHours(isMin ? 0 : 23, isMin ? 0 : 59, isMin ? 0 : 59);
			newConstraints[targetConstraint] = dateValue;
		}
		//no need to delete targetConstraint when clearing value, because dateTimeValueToConstraints already took care of it
		return newConstraints;
	}

	function dateTimeValueToConstraints(selector, value, targetConstraint, target) {
		var newConstraints = lang.mixin({}, target.get("constraints"));
		if (value) {
			value = dstamp.toISOString(value, {
				selector : selector
			});
			value = dstamp.fromISOString(value);
			newConstraints[targetConstraint] = value;
		} else {
			delete newConstraints[targetConstraint];
		}
		return newConstraints;
	}

	function numberValueToConstraints(value, targetConstraint, target) {
		var newConstraints = lang.mixin({}, target.get("constraints"));
		if (value != null && value == value) {
			newConstraints[targetConstraint] = value;
		} else {
			delete newConstraints[targetConstraint];
		}
		return newConstraints;
	}

	return {
		_ensureInterval : _ensureInterval,
		ensureRequirement : ensureRequirement,
		ensureDateInterval : lang.partial(_ensureInterval, dateValueToConstraints, "msgValiEarlierDate"),
		ensureTimeInterval : lang.partial(_ensureInterval, lang.partial(dateTimeValueToConstraints, "time"), "msgValiEarlierTime"),
		ensureDateTimeInterval : lang.partial(_ensureInterval, lang.partial(dateTimeValueToConstraints, "dateTime"), "msgValiEarlierDateTime"),
		ensureNumberInterval : lang.partial(_ensureInterval, numberValueToConstraints, "msgValiNumberInterval")
	};

});
