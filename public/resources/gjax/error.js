define([
	"dojo/_base/lang",
	"./error/_throw", //all submodules are protected dont use any of them directly in screens
	"./error/_catch",
	"./error/_handlers"
], function(lang, t, c, h) {
	
	return lang.mixin(h,c,t);
	
});