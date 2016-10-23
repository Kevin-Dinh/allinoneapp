//TODO: not finished, draft
define([
	"doh",
	"gjax/collections/indexOf",
	"gjax/Collections",
	"dojo/request",
	"dojo/string"
], function(doh, indexOf, collections, request, string) {

	function requestAndAssert(spec) {
		//signatures switch
		//a) requestAndAssert(Object spec)
		//b) requestAndAssert(status, uri, uriParams	
		arguments.length === 1 || (spec = {/*jshint expr:true */
			status : arguments[0],
			uri : arguments[1],
			uriParams : arguments[2]
		});
		return function() {
			return assertStatusCode(function() {
				return request(string.substitute(spec.uri, spec.uriParams)); /* git-qa */ // unit-test, uriParams are expected to be encoded 
			}, spec.status);
		};
	}
	function assertStatusCode(requestFunction, expectedStatus) { //TODO: refactr to /_libs
		var testResult = new doh.Deferred();

		var requestDeferred = requestFunction();

		requestDeferred.response.always(function(responseOrError) {
			var realStatus = responseOrError.status || responseOrError.response.status;
			if (realStatus === expectedStatus) {
				testResult.callback();
			} else {
				var msg = string.substitute("expected status: ${0}, but got: ${1}", [
					expectedStatus,
					realStatus
				]);
				testResult.errback(msg);
			}
		});
		return testResult;
	}
	function assertArrayEquals(/*Object*/expected, /*Object*/actual, /*String?*/hint, doNotThrow) {
		if (!collections.equals(expected, actual)) {
			if (doNotThrow) {
				return false;
			}
			throw new doh._AssertFailure("assertArrayEquals() failed:\n\texpected\n\t\t" + expected + "\n\tbut got\n\t\t" + actual + "\n\n", hint);
		} else {
			return true;
		}
	}

	return {
		// extension to doh with reasonable asserts
		hasAllProps : function(o, propList) {
			// o can be bigger than propList (o > propList)
			for ( var i = 0, l = propList.length; i < l; i++) {
				if (!(propList[i] in o)) {
					return false;					
				}
			}
			return true;
		},
		hasExactlyProps : function(o, propList) {
			var hasProps = this.hasProps(o, propList);
			return hasProps && !this._hasExtraProps(o, propList);

		},
		_hasExtraProps : function(o, propList) {
			for ( var p in o) {
				if (!~indexOf(propList, p)) //not contains
				{
					return true;
				}
			}
			return false;
		},
		//TODO: code templates
		assertStatusCode : assertStatusCode,
		requestAndAssert : requestAndAssert,
		assertArrayEquals : assertArrayEquals
	};
	

	//TODO: port node.js/asserts also (some interesting things there, still missing in doh)

});