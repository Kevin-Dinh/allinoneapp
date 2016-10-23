define([
	"module",
	"require",
	"dojo/dom-construct",
	"xstyle/core/load-css"
], function(module, moduleRequire, domConstruct, load) {
	/*
	 * AMD css! plugin
	 * Simplified version of xstyle!css which alows also to unload sctylesheet
	 */
	return {
		load : function(resourceDef, require, callback) {
			var url = require.toUrl(resourceDef);
			var cachedCss = require.cache && require.cache['url:' + url];
			if (cachedCss) {
				// we have CSS cached inline in the build
				if (cachedCss.xCss) {
					cachedCss = cachedCss.cssText;
				}
				return checkForParser(load.insertCss(cachedCss));
			}
			function checkForParser(styleSheet) {
				callback({
					remove : function() {
						require.undef(module.id + "!" + resourceDef);
						var node = styleSheet.owningElement || styleSheet.ownerNode || styleSheet;
						domConstruct.destroy(node);
					}
				});
			}
			load(url, checkForParser);
		}
	};
});
