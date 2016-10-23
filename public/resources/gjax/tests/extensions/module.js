define([
	"doh/main",
	"require",
	"./stateful"
], function(doh, _require) {

	if (doh.isBrowser) {
		doh.register("gjax/extensions/_FormValueWidget", _require.toUrl("./_FormValueWidget.html"), 9000);
		doh.register("gjax/extensions/_HasDropDown", _require.toUrl("./_HasDropDown.html"), 9000);
		doh.register("gjax/extensions/_SearchMixin", _require.toUrl("./_SearchMixin.html"), 9000);
		doh.register("gjax/extensions/_WidgetBase", _require.toUrl("./_WidgetBase.html"), 9000);
		doh.register("gjax/extensions/DateTextBox", _require.toUrl("./DateTextBox.html"), 9000);
		doh.register("gjax/extensions/RangeBoundTextBox", _require.toUrl("./RangeBoundTextBox.html"), 9000);
		doh.register("gjax/extensions/validation", _require.toUrl("./validation.html"), 9000);
		doh.register("gjax/extensions/ValidationTextBox", _require.toUrl("./ValidationTextBox.html"), 9000);
	}
});