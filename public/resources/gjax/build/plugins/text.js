define([
	"build/plugins/text",
	"dojo/json",
	"build/fs"
], function(text, json, fs) {
	return {
		start : function(mid, referenceModule, bc) {
			// mid may contain a pragma (e.g. "!strip"); remove
			mid = mid.split("!")[0];

			var textPlugin = bc.amdResources["dojo/text"];
			var moduleInfo = bc.getSrcModuleInfo(mid, referenceModule, true);

			//if localized HTML existits it should exist for all locales, so test for first
			if (bc.resources[moduleInfo.url.replace(".html", "_" + bc.localeList[0] + ".html")]) {
				if (!textPlugin) {
					throw new Error("text! plugin missing");
				}

				var textResources = {};
				bc.localeList.forEach(function(locale) {
					if (locale == "ROOT") {
						return;
					}
					var url = moduleInfo.url.replace(".html", "_" + locale + ".html");
					var textResource = textResources[locale] = bc.resources[url];
					if (!textResource) {
						throw new Error("text resource (" + url + ") missing");
					}
				});

				var result = [
					textPlugin
				];
				if (bc.internStrings && !bc.internSkip(moduleInfo.mid, referenceModule)) {
					result.push({
						textResources : textResources,
						pid : moduleInfo.pid,
						mid : moduleInfo.mid,
						deps : [],
						getText : function() {
							var locale = bc.currentLocale;
							if (!locale) {
								//if called for standalone module, do not process localization
								//return false, so file must be loaded from server
								return "false";
							}

							var textModule = this.textResources[locale];
							var text = textModule.getText ? textModule.getText() : textModule.text;
							if (text === undefined) {
								// the module likely did not go through the read transform; therefore, just read it manually
								text = fs.readFileSync(textModule.src, "utf8");
							}
							return json.stringify(text + "");
						},
						internStrings : function() {
							return [
								"url:" + this.mid,
								this.getText()
							];
						}
					});
				}
				return result;
			} else {
				//process with original plugin
				return text.start(mid, referenceModule, bc);
			}

		}
	};
});
