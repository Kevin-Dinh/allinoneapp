define([
	"dojo/Deferred",
	"require"
], function(Deferred, _require) {

	/*=====
	return {
	// summary:
	//		This module wraps dojo/domReady as Deferred.
	//		Can be used instead of dojo/domReady! plugin, to simplify page/widget code when synchronizing several deferreds 
	//		with ready event.
	};
	=====*/
	var d = new Deferred();
	_require([
		"dojo/domReady!"
	], function() {
		d.resolve();
	});
	return d;
});