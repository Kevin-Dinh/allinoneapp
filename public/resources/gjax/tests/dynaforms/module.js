/**
 * created 03/08/2013
 * 
 * @author marcus
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
		doh.register("gjax/dynaforms/parser", _require.toUrl("./parser.html"), 9000);
	}

});