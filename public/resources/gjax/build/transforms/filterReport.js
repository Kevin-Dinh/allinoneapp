define([
	"build/buildControl",
	"../messages"//to support custom bc.log messages
], function(bc) {

	var categories = {
		//copied from build/messages
		info : [
			[
				100,
				199
			]
		],
		warn : [
			[
				200,
				299
			]
		],
		error : [
			[
				300,
				399
			]
		],
		report : [
			[
				400,
				499
			]
		]
	};

	function getPrefix(id) {
		//copied from build/messages
		var result;
		for ( var p in categories) {
			/*jshint loopfunc:true*/
			if (categories[p].some(function(range) {
				if (range[0] <= id && id < range[1]) {
					return (result = p + "(" + id + ")");
				}
				return 0;
			})) {
				return result;
			}
		}
		return "message-id(" + id + ")";
	}

	return function() {
		if (bc.filterReport && bc.filterReport.length) {
			bc.messages.forEach(function(msg) {
				var symId = msg[2];
				if (bc.filterReport.indexOf(symId) > -1) {
					bc.log("filteredReport", getPrefix(msg[1]) + " " + msg[3] + " (" + msg[4].length + " entries)");
					msg[4] = [];
				}
			});
		}
	};
});
