define([
	"dojo/_base/declare",
	"./FormEditor",
	"./_FooterEditor"
], function(declare, FormEditor, _FooterEditor) {
	return declare([
		FormEditor,
		_FooterEditor
	]);
});