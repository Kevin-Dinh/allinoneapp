/**
 * created 06/28/2013
 *
 * @author lzboron
 *
 * @description test for module app/common/widget/utils
 *
 * @see http://livedocs.dojotoolkit.org/util/doh
 */
define([
	"dojo/ready",
	"doh",
	"dijit/registry",
	//tested libraries
	"gjax/widget/utils",
	//screen widgets
	"dojox/form/DateTextBox",
	"gjax/form/DateTimeTextBox",
	"dijit/form/NumberTextBox",
	"dojo/parser",
	"gjax/extensions/_FormValueWidget" //needed so get("label") works (called by utils) 
], function(ready, doh, registry, utils) {

	var dateFromWidget, dateToWidget, dateTimeFromWidget, dateTimeToWidget, numberFromWidget, numberToWidget;

	function testDateInterval() {

		//test setting constraints
		var dateFrom = new Date(2015, 2, 2);
		dateFromWidget.set("value", dateFrom);
		var toConstraints = dateToWidget.get("constraints");
		doh.assertTrue(toConstraints && toConstraints.min && toConstraints.min.getTime() == dateFrom.getTime(), "Min constraint not set on 'Date to widget'.");
		var dateTo = new Date(2015, 9, 9);
		dateToWidget.set("value", dateTo);
		var fromConstraints = dateFromWidget.get("constraints");
		doh.assertTrue(fromConstraints && fromConstraints.max && fromConstraints.max.getTime() == new Date(2015, 9, 9, 23, 59, 59).getTime(),
				"Max constraint not set on 'Date from widget'.");

		//test clearing constraints
		dateFromWidget.set("value", null);
		toConstraints = dateToWidget.get("constraints");
		doh.assertTrue(toConstraints && toConstraints.min === undefined, "Min constraint not cleared from 'Date to widget'.");
		dateToWidget.set("value", null);
		fromConstraints = dateFromWidget.get("constraints");
		doh.assertTrue(fromConstraints && fromConstraints.max === undefined, "Max constraint not cleared from 'Date from widget'.");
	}

	function testDateTimeInterval() {
		//test setting constraints
		var dateFrom = new Date(2015, 2, 2, 12, 13, 11);
		dateTimeFromWidget.set("value", dateFrom);
		var toConstraints = dateTimeToWidget.get("constraints");
		doh.assertTrue(toConstraints && toConstraints.min && toConstraints.min.getTime() == dateFrom.getTime(),
				"Min constraint not set on 'Date time to widget'.");
		var dateTo = new Date(2015, 9, 9, 2, 4, 5);
		dateTimeToWidget.set("value", dateTo);
		var fromConstraints = dateTimeFromWidget.get("constraints");
		doh.assertTrue(fromConstraints && fromConstraints.max && fromConstraints.max.getTime() == dateTo.getTime(),
				"Max constraint not set on 'Date time from widget'.");

		//test clearing constraints
		dateTimeFromWidget.set("value", null);
		toConstraints = dateTimeToWidget.get("constraints");
		doh.assertTrue(toConstraints && toConstraints.min === undefined, "Min constraint not cleared from 'Date time to widget'.");
		dateTimeToWidget.set("value", null);
		fromConstraints = dateTimeFromWidget.get("constraints");
		doh.assertTrue(fromConstraints && fromConstraints.max === undefined, "Max constraint not cleared from 'Date time from widget'.");
	}

	function testNumberInterval() {
		//test setting constraints
		numberFromWidget.set("value", 7);
		var toConstraints = numberToWidget.get("constraints");
		doh.assertTrue(toConstraints && toConstraints.min && toConstraints.min == 7, "Min constraint not set on 'Number to widget'.");
		numberToWidget.set("value", 14);
		var fromConstraints = numberFromWidget.get("constraints");
		doh.assertTrue(fromConstraints && fromConstraints.max && fromConstraints.max == 14, "Max constraint not set on 'Number from widget'.");

		//test clearing constraints
		numberFromWidget.set("value", null);
		toConstraints = numberToWidget.get("constraints");
		doh.assertTrue(toConstraints && toConstraints.min === -9000000000000000, "Min constraint not cleared from 'Number to widget'.");
		numberToWidget.set("value", null);
		fromConstraints = numberFromWidget.get("constraints");
		doh.assertTrue(fromConstraints && fromConstraints.max === 9000000000000000, "Max constraint not cleared from 'Number from widget'.");
	}

	function testOtherConstraints() {
		var maxDate = new Date(2020, 3, 2);
		dateToWidget.set("constraints", {
			max : maxDate
		});
		dateFromWidget.set("value", new Date(2010, 5, 9));
		var dateToConstraints = dateToWidget.get("constraints");
		doh.assertTrue(dateToConstraints && dateToConstraints.max.getTime() == maxDate.getTime(),
				"Changing from date removed max constraint (and probably any other constraints) from 'to widget'.");
	}

	var testObject = {
		"dateInterval" : testDateInterval,
		"dateTimeInterval" : testDateTimeInterval,
		"numberInterval" : testNumberInterval,
		"otherConstraints" : testOtherConstraints
	};

	// --------------------------------------
	doh.register("utils", testObject);

	ready(function() {
		dateFromWidget = registry.byId("dateFromWidget");
		dateToWidget = registry.byId("dateToWidget");
		utils.ensureDateInterval(dateFromWidget, dateToWidget);

		dateTimeFromWidget = registry.byId("dateTimeFromWidget");
		dateTimeToWidget = registry.byId("dateTimeToWidget");
		utils.ensureDateTimeInterval(dateTimeFromWidget, dateTimeToWidget);

		numberFromWidget = registry.byId("numberFromWidget");
		numberToWidget = registry.byId("numberToWidget");
		utils.ensureNumberInterval(numberFromWidget, numberToWidget);

		doh.run();
	});

});
