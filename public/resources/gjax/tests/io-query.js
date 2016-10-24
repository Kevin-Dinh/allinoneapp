/**
 * created 10/13/2012
 * !! do not format this test!
 * 
 * @author jukrop
 * @see http://livedocs.dojotoolkit.org/util/doh
 * @description gjax/gQuery DOH test
 * 
 * @generated by TemplateWizard, v.2012/10/01 //do not remove this comment please
 */
define([
	"doh",
	"dojo/has",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojox/lang/functional/object",
	//
	"gjax/io-query",
	"dojo/io-query",
	"dojo/date/stamp",
	"dojo/json"
], function(doh, has, array, lang, object, gQuery, dQuery, stamp, json) {

	// ---------------------------- test object ------------------
	// private functions

	function test(q2o) {
		for ( var i = 0; i < testData.length; i += 2) {
			var input = q2o ? testData[i] : testData[i + 1], expected = q2o ? testData[i + 1] : testData[i], output;
			try {
				output = gQuery[q2o ? "queryToObject" : "objectToQuery"].call(gQuery, input);
			} catch (e) {
				output = e.message;
			}
			doh.is(expected, output, json.stringify(expected) + " vs. " + json.stringify(output));
		}
	}

	function testType() {
		for ( var i = 0; i < testTypeData.length; i += 2) {
			var input = testTypeData[i], expected = testTypeData[i + 1], output;
			try {
				output = gQuery.queryToObject.call(gQuery, input);
			} catch (e) {
				output = e.message;
			}
			doh.is(expected, output, json.stringify(expected) + " vs. " + json.stringify(output));
		}
	}

	// testing data
	var testData = [
		"a=1&b=2",
		{
			a : "1",
			b : "2"
		},
		"a=1&a=3&b=2",
		{
			a : [
				"1",
				"3"
			],
			b : "2"
		},
		"a=123&b=2004",
		{
			a : "123",
			b : "2004"
		},
		"a=123&b=2004-11",
		{
			a : "123",
			b : "2004-11"
		},
		// encoding
		"a=%EB%A1%A4%ED%97%88",
		{
			a : "\uB864\uD5C8"
		}, // 롤허
		"a=+-autobus",
		{
			a : "+-autobus"
		},
		"eventDate=2007-07-01T00:00:00+0200",
		{
			eventDate : "2007-07-01T00:00:00+0200"
		},
		"identity=claimNumber%3D074100009100;eventDate%3D2007-07-01T00:00:00+0200;policyNumber%3D700001642",
		{
			identity : "claimNumber=074100009100;eventDate=2007-07-01T00:00:00+0200;policyNumber=700001642"
		}
	];

	var testTypeData = [
//		"a=123&b=2003-11-20T23:13:14.000+01:00",
//		{a:"123", b: new Date(2003,10,20,23,13,14)},
//		"a=123&b=2003-11-20T23:00",
//		{a:"123", b: new Date(2003,10,20,23)},
		"a=123&b=2003-11-20",
		{
			a : "123",
			b : new Date(2003, 10, 20)
		},
		"a=123&b=2003-11-20T",
		{
			a : "123",
			b : "2003-11-20T"
		},
		"a=number:123&b=date:2013-10-01",
		{
			a : 123,
			b : new Date(2013, 9, 1)
		},
		"a=boolean:true",
		{
			a : true
		},
		"a=true&b=null", // auto converting should work
		{
			a : true,
			b : null
		},
		"a=string:true&b=string:null",
		{
			a : "true",
			b : "null"
		}
	];

	var encodingTests = {
		"dojo encodes ampersand" : function() {

			doh.is("a=pat%26mat", dQuery.objectToQuery({
				a : "pat&mat"
			}));
		},
		"dojo encodes equals" : function() {

			doh.is("a=pat!%3Dmat", dQuery.objectToQuery({
				a : "pat!=mat"
			}));
		},
		"gjax DOES ENCODE ampersand ?" : function() {
			doh.is("a=pat%26mat", gQuery.objectToQuery({
				a : "pat&mat"
			}));
		},
		"gjax DOES ENCODE equals ?" : function() {
			doh.is("a=pat!%3Dmat", gQuery.objectToQuery({
				a : "pat!=mat"
			}));
		}
	};

	// test object
	var testObj = {
		queryToObject : lang.partial(test, true),
		objectToQuery : lang.partial(test, false),
		queryToObjectType : lang.partial(testType, true)
	};

	doh.register("gjax/uri/io-query", testObj);
	doh.register("gjax/uri/io-query", encodingTests);
	// runnable with: node (dnode)
	has("host-browser") || doh.run();
});