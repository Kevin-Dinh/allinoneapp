define([
	"../messages"//to support custom bc.log messages
], function() {

	return {
		// summary:
		//		Build time plugin for xstyle/css
		// description:
		//		This plugin ensures that css listed in profile.xstyleLayerStubs will not be loaded by plugin in runtime
		//		Css listed in this property MUST be loaded manually (e.g. in a minified & merged CSS set)
		//		(Use if you want to merge your dynamically loaded css with other css and load them with one request)

		start : function(mid, referenceModule, bc) {
			// mid may contain a pragma (e.g. "!strip"); remove
			mid = mid.split("!")[0];

			var cssPlugin = bc.amdResources["xstyle/css"];
			var stylesheetInfo = bc.getSrcModuleInfo(mid, referenceModule, true);
			var cssResource = bc.resources[stylesheetInfo.url];

			if (!cssPlugin) {
				throw new Error("xstyle/css! plugin missing");
			}

			var cssMid = stylesheetInfo.mid;
			if (bc.xstyleLayerStubs && bc.xstyleLayerStubs.indexOf(cssMid) >= 0) {
				var resource = bc.amdResources[cssMid];
				if (!resource) {
					resource = bc.amdResources[cssMid] = {//add as AMD resource, so it can be included into a layer
						module : cssResource,
						pid : stylesheetInfo.pid,
						mid : stylesheetInfo.mid,
						deps : [],
						getText : function() {
							return "'/*xstyle preloaded*/'";
						},
						internStrings : function() {
							return [
								"url:" + this.mid,
								this.getText()
							];
						}
					};
				}

				bc.log("cssIncluded", [
					"module",
					cssMid
				]);
				return [
					cssPlugin,
					bc.amdResources["xstyle/core/load-css"],
					resource
				];
			} else {
				bc.log("cssNotIncluded", [
					"module",
					cssMid
				]);
				return [
					cssPlugin
				];
			}
		}
	};
});
