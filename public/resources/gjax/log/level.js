define([
	"dojo/_base/array",
	"dojo/_base/config"
], function(array, config) {

	// module:
	//		gjax/log/level

	var logLevels = [
		"debug",
		"info",
		"warn",
		"error"
	];

	function logLevel(level, module) {
		// summary:
		//		Returns true if logging is enabled for specified level and module. Intended for conditional logging:
		//		example: level("debug", "moduleName") && console.log("debug message");
		// level:
		//		Log level - required. If not specified, function returns false. Allowed values are 'debug', 'info', 'warn', 'error'.
		// module:
		//		Log module. Optional, defaults to 'default'. List of modules and their levels needs to be defined in dojo config 'logging' property.

		if (!level || array.indexOf(logLevels, level) == -1) {
			throw new Error("Uknown or no log level specified.");
		}

		/*jshint expr:true */
		module || (module = "default");
		var logConfig = config.logging || {
			"default" : "info"
		};

		var moduleLogConfig = logConfig[module];
		if (!moduleLogConfig) {
//			console.warn("Unknown module for logging specified, using default.");
			moduleLogConfig = logConfig["default"];
		}

		return array.indexOf(logLevels, level) >= array.indexOf(logLevels, moduleLogConfig);
	}

	return logLevel;
});
