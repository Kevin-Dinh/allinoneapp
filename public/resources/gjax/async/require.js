define([
	"dojo/Deferred",
	"dojo/_base/lang"
], function(Deferred, lang) {

	return function(mids, contextRequire) {
		// summary:
		//		Version of require that returns promise, resolved when modules are required.
		// mids: String|String[]
		//		Single MID, or list of MIDs to require
		// contextRequire: function?
		//		Context require, optional attribute, needed if mid or one of mixins is relative
		// example:
		//		Requiring single module:
		// |	gRequire("./views/change/View", this.contextRequire) // relative path can be used with contextRequire
		// |	.then(lang.hitch(this, function(ChangeView) {
		// |		// instantiate modules or do what you want
		// |		this.changeView = new ChangeView(/*params*/);
		// |		this.changeView.statup();
		// |	})).otherwise(/*error handling*/);
		//		
		//		Multiple modules:
		// |	gRequire([
		// |		"mid1",
		// |		"mid2" // ...
		// |	]).then(function(modules /*array*/) {
		// |		// ...
		// |	}));

		var dfd = new Deferred();
		(contextRequire || require)(lang.isString(mids) ? [
			mids
		] : mids, function(/*module1, module2, ..*/) {
			//only for IE8 & 7, in other browsers scriptError will be raised automatically
//			if (module == "not-a-module") {
//				require.signal("error", lang.mixin(new Error("scriptError"), {
//					src : "dojoLoader",
//					info : [
//						mid
//					]
//				}));
//				dfd.reject();
//				return;
//			}

			dfd.resolve(lang.isString(mids) ? arguments[0] : Array.prototype.slice.call(arguments, 0));
		});
		return dfd;
	};
});
