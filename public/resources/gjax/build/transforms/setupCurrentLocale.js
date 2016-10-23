define([
	"build/buildControl"
], function(bc) {

	return function(resource) {
		bc.currentLocale = resource.layer.locale;
	};
});
