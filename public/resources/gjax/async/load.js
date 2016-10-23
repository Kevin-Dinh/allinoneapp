//this plugin loads modules which mid is writen in dojo config 
//
//plugin!dojoProp
//	-dojoProp value is module mid
define([
	"dojo/_base/config"
], function(config) {
	return {
		load : function(mid, require, callback) {
			require([
				config[mid]
			], function(appConfig) {
				callback(appConfig);
			});
		}
	};
});