/**
 * created 10/05/2012
 * 
 * @author marcus
 * @see http://livedocs.dojotoolkit.org/util/doh
 * @description unit test for modules "gjax/collections/indexOf*"
 * 
 * @generated by TemplateWizard, v.2012/10/01 //do not remove this comment please
 */
define([
	"doh",
	"dojo/_base/lang",
	"dojox/lang/functional/object",
	"./indexOf.testData",
	"./indexOf.testDataNaN",
	//tested libraries
	"dojo/_base/array",
	"gjax/collections/indexOf",
	"gjax/collections/indexOfNaNAware",
	"gjax/collections/_indexOf_mdc",
	"gjax/collections/_indexOf_webReflection"

], function(doh, lang, object, testData, testDataNaN, darray, gIndexOf, gIndexOfNaNAware, _indexOf_mdc, _indexOf_wr) {

	// private functions
	function doTest(fnc, data, isNative) {
		for ( var i = 0; i < data.length; i += 2) {
			var input = data[i], expected = data[i + 1], output;
			try {
				if (!isNative) {
					output = fnc.apply(null, input);					
				} else {
					output = fnc.apply(input[0], input.slice(1));
				}
			} catch (e) {
				output = e.message;
			}
			doh.is(expected, output, 
					"Array: " + input[0] + 
					" Element: " + input[1] + 
					(input[2] ? " From index: " + input[2] : "") +
					" Output: " + output + " Expected: " + expected);
		}
	}
	
	// test object
	var indexOfEqualsProblem = {

		expectingBuggyDojo : function() {
			// http://bugs.dojotoolkit.org/ticket/16104
			doh.t(darray.indexOf([
				""
			], false) === 0 && // incorrect value == used inside
			darray.indexOf([
				""
			], 0) === 0 && darray.indexOf([
				undefined
			], null) === 0);

		},
		"native" : function() {
			if (Array.prototype.indexOf) {
				doh.t([
					""
				].indexOf(false) === -1 && [
					""
				].indexOf(0) === -1 && [
					undefined
				].indexOf(null) === -1);
			}
		},
		gjax : function() {

			doh.t(gIndexOf([
				""
			], false) === -1 && // incorrect value == used inside
			gIndexOf([
				""
			], 0) === -1 && //
			gIndexOf([
				undefined
			], null) === -1);
		},
		mdc : function() {
			doh.t(_indexOf_mdc([
				""
			], false) === -1 && // incorrect value == used inside
			_indexOf_mdc([
				""
			], 0) === -1 && //
			_indexOf_mdc([
				undefined
			], null) === -1);
		}
	};
	
	var testDataFull = lang.mixin({}, testData, testDataNaN);

	var nativeTest = object.mapIn(testDataFull, function(data) {
		return lang.partial(doTest, Array.prototype.indexOf, data, true);
	});
	
	var dojoTest = object.mapIn(testDataFull, function(data, dataSetName) {
		if (dataSetName != "Nonstandard fromIndex") {
			return lang.partial(doTest, darray.indexOf, data, false);			
		} else {
			return function() {
				doh.t(false, "Infinite loop");
			};
		}
	});
	
	var mdcTest = object.mapIn(testDataFull, function(data) {
		return lang.partial(doTest, _indexOf_mdc, data, false);
	});
	
	var wrTest = object.mapIn(testDataFull, function(data) {
		return lang.partial(doTest, _indexOf_wr, data, false);
	});
	
	var gjaxTest = object.mapIn(testDataFull, function(data) {
		return lang.partial(doTest, gIndexOf, data, false);
	});
	
	var gjaxNaNAwareTest = object.mapIn(testDataFull, function(data) {
		return lang.partial(doTest, gIndexOfNaNAware, data, false);
	});
	
	doh.register("indexOf-EqualsProblem", indexOfEqualsProblem);
	
	doh.register("Array.prototype.indexOf", nativeTest);
	doh.register("dojo/_base/array.indexOf", dojoTest);
	doh.register("gjax/collections/_indexOf_mdc", mdcTest);
	doh.register("gjax/collections/_indexOf_webReflection", wrTest);
	doh.register("gjax/collections/indexOf", gjaxTest);
	doh.register("gjax/collections/indexOfNaNAware", gjaxNaNAwareTest);
});