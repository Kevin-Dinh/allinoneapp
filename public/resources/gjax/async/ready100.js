define([
	"dojo/ready",
	"dojo/Deferred"
], function(ready, Deferred) {

	/*=====
	return {
	// summary:
	//		This module wraps ready(100,factory), "widget parsing done" as Deferred.
	//		Can be used to simplify page/widget code when synchronizing several deferreds 
	//		with ready event.
	};
	=====*/

	var d = new Deferred();
	ready(100, function() {
		d.resolve();
	});
	return d;
});