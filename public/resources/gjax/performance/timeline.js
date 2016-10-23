define([
	"./has",
	"dojo/_base/array",
	"dojo/_base/lang"
], function(has, array, lang) {

	return function(perf) {
		//we need acces to performance object (native or gjax), but we cannot requrie gjax/performance (cyclic dep)
		//so make this module as factory, which accepts performance object as argument

		//if there is native getEntries, we may need to reuse it
		var getOrigEntries = perf.getEntries ? lang.hitch(perf, perf.getEntries) : function() {
			return [];
		};
		return {
			getEntries : function() {
				var entries = getOrigEntries();

				// If browser just partially supports resource or user API, there may be entries, 
				// we do not want to use in window.performance, so filter them out
				if (!has("performance-resource-timing")) {
					entries = array.filter(entries, "return item.entryType != 'resource'");
				}
				if (!has("performance-user-timing")) {
					entries = array.filter(entries, "return item.entryType == 'resource'");
				}
				if (this._marks) {
					entries = entries.concat(this._marks);
				}
				if (this._measures) {
					entries = entries.concat(this._measures);
				}
				if (this._resources) {
					entries = entries.concat(this._resources);
				}
				return entries;
			},
			getEntriesByType : function(entryType) {
				var entries = this.getEntries();
				return array.filter(entries, function(entry) {
					return entry.entryType == entryType;
				});
			},
			getEntriesByName : function(name, entryType) {
				var entries = this.getEntries();
				return array.filter(entries, entryType == null ? function(entry) {
					return entry.name == name;
				} : function(entry) {
					return entry.name == name && entry.entryType == entryType;
				});
			}
		};
	};
});