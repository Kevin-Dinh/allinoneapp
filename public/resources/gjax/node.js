define([
	"dojo/has"
], function(has) {
	if (!has("host-node")) {
		throw new Error("node plugin failed to load because environment is not Node.js");
	}
	if (!require.nodeRequire) {
		throw new Error("Cannot find native require function");
	}
	var Module = require.nodeRequire("module"); //load Module() (from node.js)
	return {
		// summary:
		//		This is GJAX extended version of dojo/node which supports adressing node modules relative to dojo modules
		//		This AMD plugin module allows native Node.js modules to be loaded by AMD modules using the Dojo
		//		loader. Note that this plugin will not work with AMD loaders other than the Dojo loader.
		// example:
		//		see test/require-node
		
		load : function(/*string*/id, /*Function*/require, /*Function*/load) {
			// summary:
			//		Standard AMD plugin interface. See https://github.com/amdjs/amdjs-api/wiki/Loader-Plugins
			//		for information.

			
			// id is the path to some node module, that caller want's to load
			// let's allow for paths relative to callersModule instead of dojo.js /* git-qa */
			//console.debug("id:", id);

			// all components loaded with this nodeRequire use dojo.js as base for loading /* git-qa */
			// and we want to change this

			var callerModuleId = require.toUrl("./_fakeName"); //require is context aware require of caller module, apending fake module name _
			var callerModule = new Module(callerModuleId); //and create node Module
			callerModule.filename = callerModuleId; //needed otherwise node uses fallback with node_module paths
			//console.dir(callerModule);
			var loadedNodeModule = callerModule.require(id); //and use node module's require to load id
			load(loadedNodeModule); //then return to caller module
		}
	};
});