define([
	"dojo/json"
], function(json) {

	return function(a, b) {
		return json.stringify(a) === json.stringify(b);
	};
});