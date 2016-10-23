/**
 * created 09/22/2012
 * 
 * @author marcus
 * @see http://livedocs.dojotoolkit.org/util/doh
 * @description unit test for module "gjax/formatters"
 */
define([
	"dojo",
	"doh",
	// import tested module
	"gjax/formatters",
	"gjax/lang/blacklistMixin",
	"gjax/lang/whitelistMixin",
	"dojo/store/Memory",
	"dojo/data/ObjectStore",
	"dojo/promise/all",
	"dojo/date/locale",
	"gjax/encoders/html/encodeSmp",
	"dojo/_base/lang"
], function(dojo, doh, f, blacklistMixin, whitelistMixin, Memory, ObjectStore, all, locale, encHtml, lang) {

	// ---------------------------- test object ------------------
	var sampleData = {
		string : "ten10",
		intNumber : 10,
		floatNumber : 10.1,
		date : new Date(),
		NULL : null,
		UNDEFINED : undefined,
		emptyString : "",
		zero : 0,
		boolFalse : false,
		boolTrue : true
	};

	var memoryStore = new Memory({
		data : [
			sampleData
		],
		idProperty : "intNumber"
	});

	// test object
	var test = {

		defaultFormatter : function() {

			doh.t(f.defaultFormatter(null) === "" && f.defaultFormatter(undefined) === "", //
			"null or undefined shall produce empty string");

			var r = f.defaultFormatter(new Date());
			doh.t(typeof r === "string",// 
			"date shall produce String");
			// TODO: test formating, i18n avare

			var otherTypesData = blacklistMixin("date,NULL,UNDEFINED".split(","), {}, sampleData);
			for ( var t in otherTypesData) {
				var value = otherTypesData[t];
				doh.t(encHtml(value) === f.defaultFormatter(value),//
				"For any other than date datatype we expect encoded value returned");
				// TODO: explain this
			}

		},
//		isoDateStringFormatter : function(/*value, options*/) {
//			doh.t(f.isoDateStringFormatter(null) === "" && f.defaultFormatter(undefined) === "", //
//			"null or undefined shall produce empty string");
//
//			var r = f.isoDateStringFormatter("2005-04-02T12:35", {
//				datePattern : "yyyy-MM-dd",
//				selector : "date"
//			});
//			doh.t(typeof r === "string", "date shall produce String");
//			doh.t(/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(r), "expected format is yyyy-M-d");
//
//			var otherTypesData = blacklistMixin("date,NULL,UNDEFINED,emptyString".split(","), {}, sampleData);
//			for ( var t in otherTypesData) {
//				var valueToFormat = otherTypesData[t];
//				doh.assertError(TypeError, f, "isoDateStringFormatter", [
//					valueToFormat
//				], "Error expected for type: " + t);
//			}
//		},
		dateFormatter : function() {
			doh.t(f.dateFormatter(null) === "" && f.defaultFormatter(undefined) === "", //
			"null or undefined shall produce empty string");

			var date = new Date();
			var r = f.dateFormatter(date);
			doh.t(typeof r === "string", "date shall produce String");

			var parsedDate = locale.parse(r, {
				selector : "date"
			});
			doh.is(parsedDate, new Date(date.getFullYear(), date.getMonth(), date.getDate()), "wrong date format");

			r = f.dateFormatter("2012-10-10T12:30");
			doh.t(typeof r === "string", "ISO string shall produce String");

			parsedDate = locale.parse(r, {
				selector : "date"
			});
			doh.is(parsedDate, new Date(2012, 9, 10), "wrong date format");

			var otherTypesData = blacklistMixin("date,NULL,UNDEFINED".split(","), {}, sampleData);
			for ( var t in otherTypesData) {
				var value = otherTypesData[t];
				doh.is("", f.dateFormatter(value),//
				"For any other than date datatype we expect empty string returned");
			}
		},
		boolFormatter : function(/*value, row, field*/) {
			var valueToFormat, formattedValue, t;
			var uncheckedData = whitelistMixin("boolFalse,NULL,UNDEFINED,zero,emptyString".split(","), {}, sampleData);
			for (t in uncheckedData) {
				valueToFormat = uncheckedData[t];
				formattedValue = f.boolFormatter(valueToFormat);
				doh.t(isCheckBox(formattedValue), "dijitCheckBox is expected");
				doh.t(!isChecked(formattedValue), "unchecked CheckBox is expected");
			}
			var checkedData = blacklistMixin("boolFalse,NULL,UNDEFINED,zero,emptyString".split(","), {}, sampleData);
			for (t in checkedData) {
				valueToFormat = checkedData[t];
				formattedValue = f.boolFormatter(valueToFormat);
				doh.t(isCheckBox(formattedValue), "dijitCheckBox is expected");
				doh.t(isChecked(formattedValue), "checked CheckBox is expected");
			}
		},
		enumFormatter : function() {
			var cell = {
				widgetProps : {
					store : memoryStore,
					searchAttr : "string"
				},
				grid : {},
				field : "x",
				resolvedField : "xResolved"
			};

			var rowObjWithResolved = {
				x : 10,
				xResolved : "ten"
			};

			var promises = [
				// existing resolved value
				f.enumFormatter(10, rowObjWithResolved, cell),
				// non-existing resolved; existing item (id 10) in store
				f.enumFormatter(10, {}, cell),
				// non-existing resolved; existing item (id 10) in store - with non matching item (may happen when editOn is used)
				f.enumFormatter(10, { // value is 10 but item contains 17
					x : 17,
					xResolved : "seventeen"
				}, cell),
				// non-existing resolved; non-existing item (id 5) in store
				f.enumFormatter(5, {}, cell),
				// non-existing resolved; non-existing item (id 5) in store - with non matching item (may happen when editOn is used)
				f.enumFormatter(5, rowObjWithResolved, cell)
			];
			var expected = [
				"ten",	// resolved value used
				"ten10", // fetched from store
				"ten10", // fetched from store (ignored wrong resolved value)
				"", // not in store
				""  // not in store (ignored wrong resolved value)
			];

			// not existing store in widgets props
			// same value will be returned
			doh.t(f.enumFormatter(11, {}, lang.mixin({}, cell, {
				widgetProps : null
			})) === 11, "11 is expected, because no store is defined");

			return all(promises)//
			.then(function(results) {
				for ( var i = 0; i < expected.length; i++) {
					doh.is(expected[i], results[i], "'" + expected[i] + "' is expected");
				}
			});
		}
	};
	doh.register("gjax/formatters", test);

	function isCheckBox(text) {
		return text && text.indexOf("dijitCheckBox") >= 0;
	}
	function isChecked(text) {
		return text && text.indexOf("dijitCheckBoxChecked") >= 0;
	}
});
