define([
	"./performance/has",
	"./performance/has!performance-navigation-timing?:./performance/navigation",
	"./performance/has!performance-resource-timing?:./performance/resource",
	"./performance/has!performance-user-timing?:./performance/user",
	"./performance/has!performance-timeline?:./performance/timeline", //if one of timeline, resource user is missing
	"./performance/has!performance-now?:./performance/now",
	"dojo/_base/lang",
	"dojox/lang/functional",
	"dojo/Evented"
], function(has, navigation, resourceFactory, userFactory, timelineFactory, nowFactory, lang, df, Evented) {

	var performance = has("performance-navigation-timing") ? window.performance : navigation;

	if (!has("performance-user-timing")) {
		lang.mixin(performance, userFactory(performance));
	}
	if (!has("performance-resource-timing")) {
		lang.mixin(performance, resourceFactory(performance));
	}
	if (!has("performance-timeline")) {
		lang.mixin(performance, timelineFactory(performance));
	}
	if (!has("performance-now")) {
		performance.now = nowFactory(performance);
	}

	// For browsers that do not support performance events (e.g. IE, FF), 
	// to allow hook on an event on object, 'on' method must exists,
	// otherwise on(performance) will throw an error
	if (!performance.addEventListener) {
		performance.on = Evented.prototype.on;
	}

	return performance;
});