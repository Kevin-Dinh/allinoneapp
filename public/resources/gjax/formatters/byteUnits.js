define([
	"dojo/string"
], function(string) {

	return function(value, template) {
		// summary:
		//		Format the value like a 'human-readable' file size (i.e. 13 KB, 4.1 MB, 102 bytes, etc).
		var v, u;

		if (value < 1024) {
			v = value;
			u = value == 1 ? "byte" : "bytes";
		} else if (value < 1024 * 1024) {
			v = (value / 1024).toFixed(1);
			u = "KB";
		} else if (value < 1024 * 1024 * 1024) {
			v = (value / 1024 / 1024).toFixed(1);
			u = "MB";
		} else {
			v = (value / 1024 / 1024 / 1024).toFixed(1);
			u = "GB";
		}
		return template ? string.substitute(template, {
			value : v,
			units : u,
			original : value
		}) : v + " " + u;
	};
});