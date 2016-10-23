define([
	"dojo/json"
], function(json) {

	//perf module will use this module, rather than global object on window 
	var perf = {
		handlers : {
			dump : function() {
				console.log(json.stringify({
					on : this.ons.names,
					topics : this.topics.names,
					aspects : this.aspects.names
				}, null, "\t"));
			}
		}
	};
	return perf;
});