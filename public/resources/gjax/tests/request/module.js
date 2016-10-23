define([
	"doh/main",
	"require",
	"./hasProxyMethodSupport",
	"./jsonXhr",
	"./util"
], function(doh, _require) {

	if (doh.isBrowser) {
		doh.register("gjax/request/jsonRefXhr", _require.toUrl("./jsonRefXhr.html"), 9000);
	}
});
