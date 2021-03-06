/**
 * created 01/03/2013
 * 
 * @author marcus
 * @description some tests missing in dojo/tests/json.js and some more
 * other dojo tests are here: /app/ui/resources/util/doh/runner.html?test=dojo/tests/json
 * 
 * 
 * @generated by TemplateWizard, v.2012/11/21 //do not remove this comment please
 */
define([
	"dojo",
	"doh",
	"gjax/testing/asserts",
	"dojo/_base/lang",
	"dojo/has",
	//tested libraries
	"dojo/json"
], function(dojo, doh, asserts, lang, has, json) {

	function _s(jsValue, expectedResult, hint) {
		// just helper for nicer/shortr test syntax
		return function() {
			var a = json.stringify({
				val : jsValue
			});
			console.debug("_s:", a);
			doh.t(expectedResult === a, hint);
		};
	}

	var dojoSerialize = {
		"serialize null" : _s(null, '{"val":null}'),
		"serialize NaN" : _s(NaN, '{"val":null}'),
		"serialize -Infinity" : _s(-Infinity, '{"val":null}'),
		"serialize Number.MAX_VALUE" : _s(Number.MAX_VALUE, '{"val":1.7976931348623157e+308}'),
		"serialize Number.MIN_VALUE" : _s(Number.MIN_VALUE, '{"val":5e-324}'),
		"seralize -0" : _s(1 / -Infinity, '{"val":0}'),
		"seralize -0 explicit sign" : _s(-0, '{"val":0}'),
		"serialize MAX int" : _s(Math.pow(2, 53), '{"val":9007199254740992}'),
		//TODO: next line is potential problem, we shall not send numbers we can not represent (illegal integral value in JS)
		// Java can accept next line but.... see 
		"serialize illegal int" : _s(Math.pow(2, 53) + 2, '{"val":9007199254740994}')
	};

	var dojoParse = {
		"parse NaN" : function() {
			//FAILS in MSIE 7
			console.log('has("json-parse"):', has("json-parse")); //IE7 uses non native algorighm
			doh.e(SyntaxError, json, "parse", [
				'{"val":NaN}'
			// with second param ommited it is accepted
			]);
		},
		"parse NaN strict" : function() {
			doh.e(SyntaxError, json, "parse", [
				'{"val":NaN}',
				true
			]);
		},
		"parse illegal int" : function() {
			// what you see is not what you get
			// legal in Java is illegal in JS, avoid out of js range longs in json.
			// TODO: HOW ?
			doh.t(9007199254740993 === json.parse('{"val":9007199254740992}').val);
			doh.t(9007199254740994 === json.parse('{"val":9007199254740994}').val);
		},
		"parse many digits" : function() {

			var wrong_expectation = 485838.6939679626641033604981823339547575;
			var real = json.parse('{"val":485838.6939679626641033604981823339547575}').val;

			doh.t(wrong_expectation === real); //and wrong test

			// in reality it is
			doh.t(485838.69396796264 === real);
			
			console.log(real); //and this can lie as well !
		},
		"test reviver parameter" : function() {
			//FAILS in MSIE 7 see my bug report http://bugs.dojotoolkit.org/ticket/16537
			var a = json.parse('{"val": 1}', function(k, v) {
				return k === "" ? v : v * 2;
			});
			doh.t(2 === a.val, "If reviver is used this shall be true, but received:" + a.val);
		}

	};

	var tests = lang.mixin({}, dojoSerialize, dojoParse);
	doh.register("dojo/json", tests);

});
