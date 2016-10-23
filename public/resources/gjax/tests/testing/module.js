//define([
//	"./charset",
//	"./DateTextBox/DateTextBox",
//	"./RangeBoundTextBox/RangeBoundTextBox",
//	"./ValidationTextareaMixin/ValidationTextareaMixin",
//	"./WarningTextBox/WarningTextBox"
//], function() {
//
//});

define([
	"doh/main",
	"require"
], function(doh, _require) {

	if (doh.isBrowser) {
		doh.register("gjax/testing/validation", _require.toUrl("./validation.html"), 9000);
	}

});