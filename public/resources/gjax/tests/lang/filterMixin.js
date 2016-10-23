/**
 * created 01/05/2015
 * 
 * @author marcus
 * @description filterMixin test
 * 
 * Main purpose is to remind that we have some basic api for filtered minin style and
 * not only whitelist and blacklist mixins
 * 
 */
define([
	"doh",
	"dojo/has",
	"gjax/collections/indexOf",
	//tested libraries
	"gjax/lang/_base"
], function(doh, has, indexOf, glang) {

	// test object
	var test = {

		"filterMixin (whitelist)" : function() {
			// this is  how whitelistMixin is implemented
			var orig = null;
			var mix = {
				a : "a",
				b : "b"
			};
			var newObj = glang.filterMixin(whitelisted([
				"a"
			]), orig, mix);
			doh.is({
				a : "a"
			}, newObj);

			function whitelisted(whitelist) {
				return function(propName) {
					return indexOf(whitelist, propName) !== -1;
				};
			}
		},
		"filterMixin (only not null and whitelisted)" : function() {
			// this is  how whitelistMixin is implemented
			var orig = {

			};
			var mix = {
				a : 2,
				b : 0,
				c : undefined,
				d : null
			};
			var newObj = glang.filterMixin(whitelistedNonNull([
				"a",
				"b",
				"c",
				"d"
			]), orig, mix);

			doh.is({
				a : 2,
				b : 0
			}, newObj);

			function whitelistedNonNull(whitelist) {
				return function(propName, source) {
					// can be changed to propName in source or any check you may need
					return source[propName] != null && indexOf(whitelist, propName) !== -1;
				};
			}
		},
		"filterMixin (override only existing)" : function() {
			var orig = {
				a : 1,
				b : 1
			};
			var mix = {
				a : 2,
				b : 2,
				c : 2
			};
			var newObj = glang.filterMixin(ifExistsInOrigin, orig, mix);

			doh.is({
				a : 2,
				b : 2
			}, newObj);

			function ifExistsInOrigin(propName /*, source */) {
				// scoped variable needed, fix call in _base to filterFunction and send original params as well (not only propName and destination)
				return propName in orig;
			}
		},
		"lodash.defaults" : function() {
			var orig = {
				a : 1,
				b : 1,
				n : null,
				u : undefined
			};

			glang.filterMixin(defaults, orig, {
				a : 2,
				c : 2
			}, {
				b : 3,
				c : 3,
				n : 3,
				u : 3
			});
			function defaults(name, source, dest) {
				return dest[name] === undefined;
			}
			doh.is(2, orig.c);
			doh.is(1, orig.a);
			doh.is(1, orig.b, "second source not applied if first set the value");
			doh.is(null, orig.n, "null is not overriden");
			doh.is(3, orig.u, "specified but undefined are overriden");
		}

	};

	doh.register("gjax/lang/filterMixin", test);

	// runnable with: dnode UI/app-ui/src/main/webapp/WEB-INF/views/unit-test/gjax/lang/whitelistMixin.js
	has("host-browser") || doh.run();
});
