//TODO: correct/optimize/minimize and align with https://github.com/phiggins42/has.js style 
define([
	"dojo/sniff"
], function(has) {

	if (has("host-browser")) {

		has.add("performance-navigation-timing", function(w) {
			return !!(w.performance && w.performance.navigation && w.performance.timing);
		});
		has.add("performance-timeline", function(w) {
			var p = w.performance;
			var hasTimelineApi = !!(p && p.getEntries && p.getEntriesByType && p.getEntriesByName);
			// if user-timing or resource-timing is not availible (or not used due to bugs), we must not use original timeline API 
			// 	because it would not work with custom collected user/resource entries
			return hasTimelineApi && has("performance-user-timing") && has("performance-resource-timing");
		});
		has.add("performance-resource-timing", function(w) {
			var p = w.performance;
			if (has("chrome")) {
				// older chrome versions did not have clearResourceRiming (I could not find exact verions number)
				// they used to have webkitClearResourceTimings, which maybe could be used
				// but we do not try to do the best for old version, so just use our polyfil
				return !!(p && p.clearResourceTimings);
			}

			if (has("ie") && has("ie") < 10) {
				return false;
			}
			if (has("ios")) { //on ios performance is missing methods like "clearResourceTimings"
				return false;
			}
			return !!(p && p.getEntriesByType && p.getEntriesByType("resource").length);
		});
		has.add("performance-user-timing", function(w) {
			return !!(w.performance && w.performance.mark);
		});
		has.add("performance-now", function(w) {
			return !!(w.performance && w.performance.now);
		});

		//TODO: add bugs mentioned in web_performance_daybook_volume_2 //probably will mean version sniffing
	}

	return has;
});