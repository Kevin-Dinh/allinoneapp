define([
	"build/buildControl",
	"build/fs",
	"../messages"//to support custom bc.log messages
], function(bc, fs) {

	return function() {

		var reportFile = bc.basePath + "/pre-build-views/report.txt";
		var jspxReportLines = fs.readFileSync(reportFile, "utf8").split("\r\n");
		jspxReportLines.forEach(function(line) {
			if (!line || !line.length) {
				return;
			}
			var idx = line.indexOf(":");
			var code = line.substring(0, idx);
			var msg = line.substring(idx + 1);
			bc.log(code, [
				msg
			]);
		});

	};
});
