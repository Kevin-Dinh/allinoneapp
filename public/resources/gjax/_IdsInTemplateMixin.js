define([
	"dojo/_base/declare"
], function(declare) {
	return declare(null, {
		buildRendering : function() {
			this.templateString = this._prefixTemplateIds(this.templateString);
			this.inherited(arguments);
		},
		_prefixTemplateIds : function(template) {
			template = template.replace(/ (id|for|aria-labelledby|aria-describedby)="/g, " $1=\"" + this.id + "_");
			template = template.replace(/containerId[ ]*:[ ]*'/g, " containerId:'" + this.id + "_");
			return template;
		}
	});
});