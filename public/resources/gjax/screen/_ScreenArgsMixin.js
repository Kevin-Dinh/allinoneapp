define([
	"dojo/_base/declare",
	"gjax/tdi",
	"gjax/uri/Uri",
	"gjax/lang/whitelistMixin"
], function(declare, tdi, Uri, whitelistMixin) {

	return declare(null, {
		// screenArgs: [const readonly] Array
		//		Whitelist of argument names that should be automaticly mixed in from URL query, wnd args, or by SPA
		screenArgs : null,
		
		postMixInProperties : function() {
			// summary:
			//		Mixes arguments into this instance.
			// description:
			//		Mixes arguments that are listed in screenArgs to this instance.
			// tags:
			//		private
			this.inherited(arguments);
			if (this.screenArgs) {
				if (!this.noWndArgs) {
					//if noWndArgs is true, do not mixin wnd args (useful in SPA)	
					whitelistMixin(this.screenArgs, this, tdi.getArguments());
				}
				if (!this.noQueryArgs) {
					//if noQueryArgs is true, do not query args .
					var screenQuery = Uri.getQuery(null, true),
					spaQuery = Uri.getQuery(Uri.getFragment() || "", true);

					whitelistMixin(this.screenArgs, this, screenQuery, spaQuery);
				}
			}
		}
	});
});
