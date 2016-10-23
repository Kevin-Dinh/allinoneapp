define([
	"dojo/string",
	"require",
	"dojo/_base/config",
	"dojo/_base/lang"
], function(string, require, config, lang) {

	// module:
	// 		gjax/i18n
	// summary:
	// 		This module implements the gjax/i18n plugin
	// description:
	// 		We choose to include our own plugin to support localization files read from message.properties
	//		with fallback to parent folders

	var cache = {};

	// regexp for reconstructing the master bundle name from parts of the regexp match
	// nlsRe.exec("foo/bar/baz/nls/foo") gives:
	// ["foo/bar/baz/nls/en-ca/foo", "foo/bar/baz/nls/", "/", "/", "foo"]
	var nlsRe = /(^.*(^|\/)nls)(\/|$)([^\/]*)/;

	function preventNull(v, key) {
		// default transformer, prevents string.substitute crash when no value is provided
		v == null && console.warn("Missing message parameter for key '" + key + "'.");
		return v == null ? "" + v : v;
	}

	function get(messageCode, map, transform, thisObject) {
		// summary:
		//		Function that will be mixed into returning object for getting the message
		if (!(messageCode in this)) {
			console.warn("Message code '" + messageCode + "' is undefined. Code is returned instead of message.");
			return messageCode;
		}
		var message = this[messageCode];
		if (arguments.length > 1) {
			// if message expects map attr to be array with exactly one item, this item may be passed directly as string
			if (lang.isString(map)) {
				map = [
					map
				];
			}
			return string.substitute(message, map, transform || preventNull, thisObject);
		}
		return message;
	}

	function doLoad(require, bundlePathAndName, finishCallback) {
		// get the root bundle which instructs which other bundles are required to construct the localized bundle
		// added query string for caching workaround
		var bundleUrl = require.toUrl(bundlePathAndName) + ".js" + "?l=" + config.locale;
		require([
			bundleUrl
		], function(root) {
			var current = lang.clone(root.root);
			var availableResources = root.availableResources;
			var modulesToLoad = [];
			for (var i = 0; i < availableResources.length; i++) {
				if (!cache[availableResources[i]]) {
					var moduleUri = require.toUrl(availableResources[i]) + ".js" + "?l=" + config.locale;
					modulesToLoad.push(moduleUri);
				}
			}

			require(modulesToLoad, function() {
				for (var i = 0; i < availableResources.length; i++) {
					var res = availableResources[i];
					if (!cache[res]) {
						cache[res] = arguments[i];
					}
					current = lang.mixin({}, cache[res], current);
				}
				current.get = get;
				cache[bundlePathAndName] = current;
				finishCallback();
			});
		});
	}

	return {
		load : function(id, require, callback) {
			// summary:
			//		id is in following format: <code>{path}/nls/{bundle}</code>
			//
			//		The requested bundle is loaded first, which instructs the plugin what additional resources are required. 
			//		These additional resources are loaded and a mix of the root and each fallback resource is returned. For example:
			//
			// 		1. The client demands "gjax/i18n!a/b/nls/messages"
			// 		2. The plugin require's "a/b/nls/messages", which is the root bundle.
			// 		3. If the root bundle indicates that availible resources are "a/b/gnls/_messages" and "a/gnls/_messages", 
			// 		the plugin requires these resources.		
			// 		4. Upon receiving all required bundles, the plugin constructs the value of the bundle as...
			//
			// 			mixin(mixin(mixin({}, require("a/gnls/_messages"),
			// 			require("a/b/gnls/_messages")),
			// 			require("a/b/nls/messages"));
			//
			// 		This value is inserted into the cache and published to the loader at the
			// 		key/module-id a/b/nls/someBundle/{locale}.
			//
			// 		This module does not provide preload (as dojo/i18n). Custom transoform in build process, 
			// 		which creates standard layer with bundles, is used instead.

			var match = nlsRe.exec(id);
			var GNLS_FOLDER = config.gnlsFolder || "/gnls";
			var bundlePathAndName = (match[1].replace("/nls", GNLS_FOLDER) + "/" + match[4]);

			if (!cache[bundlePathAndName]) {
				doLoad(require, bundlePathAndName, finish);
			} else {
				finish();
			}

			function finish() {
				var origImpl = lang.delegate(cache[bundlePathAndName]);
				// allow to call i18n("messageCode") directly, instead of using i18n.get
				var newImpl = lang.hitch(origImpl, "get");
				lang.mixin(newImpl, origImpl);
				callback(newImpl);
			}
		}
	};
});