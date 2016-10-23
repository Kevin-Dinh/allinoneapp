// summary:
//		message mixin for View
// description:
//		add message handler to display message for user in dialog or messagePane format
//		
//code:
//	message("info", i18n("veryImportantMessage"))
//	message("info", i18n("veryImportantMessage")).then(function(returnValue){...})
//				

define([
	"dojo/_base/declare",
	"dojo/has",
	"gjax/_MessagePaneMixin",
	"gjax/dialog",
	"dojo/i18n!../gjax/nls/_MessageMixin",
	"dojo/Deferred"
], function(declare, has, _MessagePaneMixin, dialog, i18n, Deferred) {

	return declare(_MessagePaneMixin, {

		messageAsDialog : has("messageAsDialog"), //display all messages as dialog

		message : function(type, message, keepPrevious, forcePane) {
			if (!forcePane && this.messageAsDialog) {
				return this.messageDialog(type, null, message);
			} else {
				this.inherited(arguments);
				return this._resolve();
			}
		},
		
		messageDialog : function(type, title, message) {
			if (!type || type == "clean") {
				return this._resolve();
			}
			title = title || this._getTitle(type);
			return dialog[type](title, message);
		},

		messagePane : function(type, message, keepPrevious) {
			return this.message(type, message, keepPrevious, true);
		},

		_getTitle : function(type) {
			//titleInfo
			return i18n["title" + type[0].toUpperCase() + type.substring(1)];
		},
		_resolve : function() {
			var deferred = new Deferred();
			return deferred.resolve(true);
		}
	});
});