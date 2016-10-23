define([
	"doh/main",
	"require"
], function(doh, _require) {

	if (doh.isBrowser) {
		doh.register("gjax/form/charset", _require.toUrl("./charset.html"), 9000);
		doh.register("gjax/form/DateTextBox", _require.toUrl("./DateTextBox.html"), 9000);
		doh.register("gjax/form/RangeListTextBox", _require.toUrl("./RangeListTextBox.html"), 9000);
		doh.register("gjax/form/ValidationTextareaMixin", _require.toUrl("./ValidationTextareaMixin.html"), 9000);
		doh.register("gjax/form/WarningTextBox", _require.toUrl("./WarningTextBox.html"), 9000);
	}

});