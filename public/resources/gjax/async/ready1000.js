define([
	"dojo/ready",
	"dojo/Deferred"

], function(ready, Deferred) {
	
	/*=====
	return {
	// summary:
	//		This module wraps default ready(1000,factory) as Deferred.
	//		Can be used to simplify page/widget code when synchronizing several deferreds 
	//		with ready event.
	};
	=====*/
	
	var d = new Deferred();
	ready(1000, function() {
		d.resolve();
	});
	return d;
});