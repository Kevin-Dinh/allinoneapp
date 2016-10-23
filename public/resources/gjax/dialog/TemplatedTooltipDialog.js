define([
	"dojo/_base/declare", // declare
	"dijit/TooltipDialog",
	"dijit/_WidgetsInTemplateMixin",
	"gjax/_ViewMixin" // _ViewMixin._prefixTemplateIds()
], function(declare, TooltipDialog, _WidgetsInTemplateMixin, _ViewMixin) {

	var TemplatedTooltipDialog = declare([
		TooltipDialog,
		_ViewMixin,
		_WidgetsInTemplateMixin
	], {
		// contentTemplateString: [protected] String
		//		template that will be used as dialog content
		contentTemplateString : "",

		buildRendering : function() {
			//Add content template inside original tooltip dialog template
			this.templateString = this.templateString.replace(
					'<div data-dojo-attach-point="containerNode"></div>',
					'<div data-dojo-attach-point="containerNode">' + this.contentTemplateString + '</div>');

			this.templateString = this._prefixTemplateIds(this.templateString);
			this.inherited(arguments);
		}
	});

	return TemplatedTooltipDialog;
});
