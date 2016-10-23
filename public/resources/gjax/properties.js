define([], function() {
	
	function parse(propertiesString) {
		var parsedProps = {};
		var lines = propertiesString.split(/\r?\n/g);
		for (var i = 0; i < lines.length; i++) {
			if (lines[i]) {
				var line = lines[i];
				var eqIndex = line.indexOf("=");
				if (eqIndex > -1) {
					//some characters should be escaped by \ in properties file, do unescape
					parsedProps[line.substring(0, eqIndex)] = line.substring(eqIndex + 1).replace(/\\n/g, "\n").replace(/\\([#!=:])/g, "$1");
				}
			}
		}
		return parsedProps;
	}
	
	return {
		parse : parse
	};
});