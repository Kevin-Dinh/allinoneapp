/**
 * created 10/16/2013
 * 
 * @author arakovsky
 * @see http://livedocs.dojotoolkit.org/util/doh
 * @description test case registration script 
 * 
 * @generated by TemplateWizard, v.2012/10/01 //do not remove this comment please
 */
define([
	"doh/main",
	"require"
], function(doh, _require) {

	if (doh.isBrowser) {
		doh.register("gjax/ready", _require.toUrl("./ready.html"), 9000);
	}

});