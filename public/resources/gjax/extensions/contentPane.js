define([
	"dijit/layout/ContentPane",
	"gjax/error",
	"gjax/log/level"
], function(ContentPane, error, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Error handling of content parsing");

	ContentPane.extend({
		_onError : function(type, err, consoleText) {
			this.onLoadDeferred.reject(err);

			// shows user the string that is returned by on[type]Error
			// override on[type]Error and return your own string to customize
			var errText = this['on' + type + 'Error'].call(this, err);
			if (consoleText) {
				//AR: origin just logs to console
				error.errbackDialogFatal(err);
				//console.error(consoleText, err);
			} else if (errText) {// a empty string won't change current content
				this._setContent(errText, true);
			}
		}
	});

});