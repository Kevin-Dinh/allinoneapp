define([
	"build/fs",
	"dojo/json",
	"dojo/_base/lang",
	"gjax/properties",
	"dojo/has!host-node?dojo/node!fs"
], function(fs, json, lang, properties, nodeFs) {

	function getPackageLocation(moduleInfo) {
		var packageLocation = moduleInfo.pack.location;
		/*jshint expr:true*/
		(packageLocation[packageLocation.length - 1] == "/") || (packageLocation += "/");
		return packageLocation;
	}

	function generateLocaleTexts(resource, moduleInfo, bc) {
//		console.log(ref.toJson(moduleInfo, true));
		var localeTexts = {};
		var packageLocation = getPackageLocation(moduleInfo);
		for (var i = 0; i < bc.localeList.length; i++) {
			var locale = bc.localeList[i];
			if (locale != "ROOT") {
				var transformedLocale = transformLocale(locale);
				var resourceParts = resource.match(/.*?\/(.*?)\/?gnls\/(.*)/);
				/*jshint laxbreak:true*/
				var propertiesFilename = packageLocation + (resourceParts[1] ? (resourceParts[1] + "/") : "") + resourceParts[2] + "_" + transformedLocale
						+ ".properties";
				if (nodeFs && !nodeFs.existsSync(propertiesFilename)) {
					localeTexts[locale] = {};
				} else {
					var propertiesFile = fs.readFileSync(propertiesFilename, "utf8");
					localeTexts[locale] = properties.parse(propertiesFile);
				}
			}
		}
		return localeTexts;
	}

	function transformLocale(locale) {
		return locale.substring(0, 2) + "_" + locale.substring(3).toUpperCase();
	}

	function getAvailableResources(moduleInfo, bc) {
		var availableResources = [];
		var propertiesFilename = moduleInfo.url.match(/\/nls\/(\w+)/)[1];
		var requiredResource = true; //user requires either nls/messages or module with custom name (eg. nls/screen)
		var packageLocation = getPackageLocation(moduleInfo);
		var pid = moduleInfo.pid;
		var mid = moduleInfo.mid;
		var resourceFolder = mid.substring(mid.indexOf("/"), mid.indexOf("/nls/")).substring(1); //substring(1) used to match test/foo/nls/ anf test/nls/ the same way
		while (resourceFolder !== null) {
			for (var i = 0; i < bc.localeList.length; i++) {
				var locale = bc.localeList[i];
				if (locale != "ROOT") {
					var transformedLocale = transformLocale(locale);
					/*jshint laxbreak:true*/
					var propFile = packageLocation + (resourceFolder ? (resourceFolder + "/") : "") + propertiesFilename + "_" + transformedLocale
							+ ".properties";
					var exists;
					if (nodeFs) {
						exists = nodeFs.existsSync(propFile);
					} else { //using stats instead of exists, because there is no exists for rhino
						var stats = fs.statSync(propFile);
						exists = stats && stats.isFile();
					}
					//requiredResource needs to be added even if it doesnt exist to create fake resource with list of available resources
					if (requiredResource || exists) {
						availableResources.push(pid + (resourceFolder ? ("/" + resourceFolder) : "") + "/gnls/" + propertiesFilename);
						break; //if resource was found for at least one locale, jump to next resource
					}
				}
			}
			if (requiredResource) { //if custom name was used, check also _messages in same folder
				requiredResource = false;
				propertiesFilename = "_messages";
			} else {
				if (resourceFolder === "") { //top of the package
					resourceFolder = null;
				} else { //move folder up
					resourceFolder = resourceFolder.indexOf("/") > -1 ? resourceFolder.substring(0, resourceFolder.lastIndexOf("/")) : "";
				}
			}
		}
		return availableResources;
	}

	function getText(resourceMid, gnlsResourceMid, availableResources, bc) {
//		console.log(locale);
//		console.log(ref.toJson(this._texts, true));

		if (!bc.currentLocale) {
			throw new Error("currentLocale is not specified.");
		}

		var module;
		if (resourceMid == gnlsResourceMid) {
			module = [
				"define({root:(",
				json.stringify(this._texts[bc.currentLocale] || {}),
				")"
			];
			module.push(",availableResources:");
			module.push(json.stringify(availableResources.filter(function(res) {
				return res != gnlsResourceMid;
			})));
			module.push("});");
		} else {
			module = [
				"define(",
				json.stringify(this._texts[bc.currentLocale]),
				");"
			];
		}
		return module.join("");
	}

	return {
		start : function(mid, referenceModule, bc) {
			// mid may contain a pragma (e.g. "!strip"); remove
			mid = mid.split("!")[0];

			var i18nPlugin = bc.amdResources["gjax/i18n"];

			var moduleInfo = bc.getSrcModuleInfo(mid, referenceModule, true);

			if (!i18nPlugin) {
				throw new Error("gjax/i18n! plugin missing");
			}
			var result = [
				i18nPlugin
			];

			var gnlsResourceMid = moduleInfo.mid.replace("/nls/", "/gnls/");
			var resource = bc.amdResources[gnlsResourceMid];

			var availableResources = getAvailableResources(moduleInfo, bc);

			for (var i = 0; i < availableResources.length; i++) {
				var texts = generateLocaleTexts(availableResources[i], moduleInfo, bc);

				resource = bc.amdResources[availableResources[i]];
				if (!resource) {
					resource = bc.amdResources[availableResources[i]] = {//add as AMD resource, so it can be included into a layer
						tag : {
							amd : 1,
							gnls : true
						},
						pid : moduleInfo.pid,
						mid : "url:" + availableResources[i] + ".js?l=$$LOCALE$$",
						deps : [],
						_texts : texts,
						getText : lang.partial(getText, availableResources[i], gnlsResourceMid, availableResources, bc)
					};
				}
//				console.log("pushing resource: " + moduleInfo.mid);
//				console.log(availableResources[i]);
				result.push(resource);
			}
//			console.log("********************************************************************");
//			console.log(json.stringify(result, null, "  "));
//			console.log("--------------------------------------------------------------------");
			return result;
		}
	};
});
