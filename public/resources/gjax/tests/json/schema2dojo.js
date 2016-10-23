define([
	"doh",
	"gjax/dynaforms/schema2dojo",
	"dojo/json"
], function(doh, schema2dojo, json) {

	// http://localhost:8080/unius/app/ui/resources/util/doh/runner.html?registerModulePath=tst,/unius/tst/ui&test=tst/test/dynaforms/libs/dynaforms/test/schema2dojo
	
	function assertSame(e, d, h) {
		console.debug(e, d);
		return doh.is(json.stringify(e), json.stringify(d), h);
	}

	var testObject = {
		"number" : function() {
			var d = {
				type : "number"
			};
			var e = {
				type : "number",
				_meta : {
					ctor : "NumberTextBox",
					props : {
						label : ""
					}
				}
			};
			assertSame(e, schema2dojo(d));
		},
		"integer" : function() {
			var d = {
				type : "integer"
			};
			var e = {
				type : "integer",
				_meta : {
					ctor : "NumberTextBox",
					props : {
						label : "",
						constraints : {
							places : 0
						}
					}
				}
			};
			assertSame(e, schema2dojo(d));
		}
	};
	doh.register("_schema2dojo", testObject);
});