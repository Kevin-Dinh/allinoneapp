/**
 * created 07/16/2015
 * 
 * @author marcus
 * @see http://livedocs.dojotoolkit.org/util/doh
 * @description 
 * 
 * @generated by TemplateWizard, v.2015/07/16 //do not remove this comment please
 */
define([
	"doh",
	"dojo/has",
	"require",
	"dojo/Deferred",
	"dojo/request/registry",
	"dojo/when"
], function(doh, has, _require, Deferred, registry, when) {

	var TIMEOUT = 5000;
	function SETUP() {
		// clear has cache
		delete has.cache["request-method-support-PUT"];
		delete has.cache["request-method-support-DELETE"];
		delete has.cache["request-method-support-PATCH"];

		this._provider = registry.register(/foo\/bar/, function() { //mock request provider
			return when(); //any method will return success
		}, true);
	}

	function TEAR_DOWN() {
		this._provider.remove();
	}

	var testObject = {

		"test detected values" : {
			timeout : TIMEOUT,
			setUp : SETUP,
			tearDown : TEAR_DOWN,
			runTest : function() {
				var testResult = new Deferred();
				_require([
					"gjax/request/hasProxyMethodSupport!/foo/bar"
				], testResult.resolve);

				return testResult//
				.then(function() {
					doh.assertTrue(has("request-method-support-PUT") === true, "request-method-support-PUT shall be true");
					doh.assertTrue(has("request-method-support-DELETE") === true, "request-method-support-DELETE shall be true");
					doh.assertTrue(has("request-method-support-PATCH") === true, "request-method-support-PATCH shall be true");
				});
			}
		},
		"test config values" : {
			timeout : TIMEOUT,
			setUp : SETUP,
			tearDown : TEAR_DOWN,
			runTest : function() {
				var testResult = new Deferred();
				_require({
					has : {
						"request-method-support-PUT" : false,
						"request-method-support-DELETE" : false,
						"request-method-support-PATCH" : false
					}
				}, [
					"gjax/request/hasProxyMethodSupport!/foo/bar"
				], testResult.resolve);

				return testResult//
				.then(function() {
					doh.assertTrue(has("request-method-support-PUT") === false, "request-method-support-PUT shall be false");
					doh.assertTrue(has("request-method-support-DELETE") === false, "request-method-support-DELETE shall be false");
					doh.assertTrue(has("request-method-support-PATCH") === false, "request-method-support-PATCH shall be false");
				});
			}
		}
	};
	doh.register("hasProxyMethodSupport-Object", testObject);

});