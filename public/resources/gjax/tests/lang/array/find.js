/**
 * created 07/10/2015
 * 
 * @author marcus
 * @see http://livedocs.dojotoolkit.org/util/doh
 * @description TODO: fill in description
 * 
 * @generated by TemplateWizard, v.2015/01/08 //do not remove this comment please
 */
define([
	"doh",
	"dojo/has",
	//tested libraries
	"gjax/lang/array/find"
], function(doh, has, arrayFind) {

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find

	// TODO: lets try to make test for native and nonnative in browsers supporting native
	// native now supported only in FF 25+
	// 

	var testObject = {
		"has-es6-array-find" : function() {
			console.log(has("es6-array-find"));
		},
		"simple, using only item in predicate function" : function() {
			var r = arrayFind([
				1,
				2,
				3
			], function(item /* index, array */) {
				return item === 2;
			});
			doh.is(2, r);
		},
		"simple, border conditions" : function() {
			var r, a = [
				1,
				2,
				3
			];
			// first
			r = arrayFind(a, function(item /* index, array */) {
				return item === 1;
			});
			doh.is(1, r);
			// last
			r = arrayFind(a, function(item /* index, array */) {
				return item === 3;
			});
			// not found
			doh.is(3, r);

			r = arrayFind(a, function(item /* index, array */) {
				return item === 100000;
			});
			doh.is(undefined, r);
		},
		"using index and array in prodicate function" : function() {
			var r = arrayFind([
				1,
				2,
				3
			], function(item, index, array) {
				// synthetic sample
				return item === 2 && index === 1 && array.length === 3;
			});
			doh.is(2, r);
		},
		"null array" : function() {
			try {
				arrayFind(null, function() {
				});
				doh.t(false, "unexpected success");
			} catch (ex) {
				// TODO: verify on FF please, this test is valid for ployfill impl 
				doh.is("Array.prototype.find called on null or undefined", ex.message);
			}
		},
		"bad predicate" : function() {
			try {
				arrayFind([], "not a function");
				doh.t(false, "unexpected success");
			} catch (ex) {
				// TODO: verify on FF please, this test is valid for polyfill impl 
				if (has("es6-array-find")) { // native
					doh.is("not a function is not a function", ex.message);
				} else { // polyfill
					doh.is("predicate must be a function", ex.message);
				}
			}
		}
	};

	doh.register("gjax/lang/array/find", testObject);

	// runnable with: node (dnode)
	has("host-browser") || doh.run();

});
