define([
	"./wnd",
	"dojo/_base/lang",
	"gjax/uri/Uri",
	"gjax/lang/blacklistMixin",
	"dojo/Deferred"
], function(wnd, lang, Uri, blacklistMixin, Deferred) {

	var REOPEN_ARGS = "__reopen_args";
	var RETURN_ARGS = "__return_args";

	// module:
	//		gjax/tdi
	var tdi = {
		// summary:
		//		This module defines main TDI functionality.
		// description:
		//		Used to open windows and tabs. Provides higher level of abstraction than gjax/wnd.
		//
		//		Note: When opening tabs (using "new" option), new window may be opened instead.
		//		This happens during debugging. More importantly, this also happens when the 
		//		opening was NOT caused by user initiated event (browser security measures). 
		//		This means, for example, that new tab cannot be opened in XHR or setTimeout callback!
		//		One solution is to use synchronous XHR in cases like this.

		// defaultOption: String
		//		Default option to be used, when navigating by TDI widgets.
		defaultOption : "same",

		// defaultEnabledOptions: String[]
		//		Default option that are enabled for TDI widgets.
		defaultEnabledOptions : [
			"same",
			"new"
		],

		// defaultNewWinFeatures: Object|Function
		//		Default features for new windows.
		defaultNewWinFeatures : {},
		
		// defaultOpenInExisting: Boolean
		//		Default for opening targets with same URI in same window.
		defaultOpenInExisting : false,

		// optionKeys: [readonly] String[]
		//		Keys for tdi.options object.
		optionKeys : [
			"same",
			"new",
			"newWin"
		],

		optionLabelCodes : {
			"same" : "menuOpenSame",
			"new" : "menuOpenNew",
			"newWin" : "menuOpenNewWin"
		},

		// _options: [const readonly] Object
		//		Possible TDI options.
		_options : {
			"same" : function(openOptions, reopenArgs) {
				tdi._addReopenArgs(openOptions, reopenArgs);
				return wnd.open(lang.mixin(openOptions, {
					name : "_self",
					features : ""
				}));
			},
			"new" : function(openOptions) {
				// no features causes opening on tab
				return wnd.open(lang.mixin(openOptions, {
					name : null,
					features : ""
				}));
			},
			"newWin" : function(openOptions) {
				// null features will open default window (see gjax/wnd for current defaults)
				return wnd.open(lang.mixin(openOptions, {
					name : null,
					features : openOptions.features || null
				}));
			},
			"existing" : function(openOptions, reopenArgs) {
				var w = wnd.findWndsByUri(openOptions.url);
				if (w) {
					if (w.name == window.name) {
						tdi._addReopenArgs(openOptions, reopenArgs);
					}
					return wnd.open(lang.mixin(openOptions, {
						name : w.name
					}));
				} else {
					return null;
				}
			}
		},

		open : function(option, uri, args, features, callback, openInExisting, reopenArgs, closeWithParent) {
			// summary:
			//		Open `uri` according to provided TDI `option`.
			// option: String
			//		One of option keys "same", "new" or "newWin". For limitarions of "new" option see module docs.
			// uri: String
			//		URI to open.
			// args: Object?
			//		Arguments to send to opened window.
			// features: String?|Object?
			//		Features of new window, used only with "newWin" `option`.
			// callback: Function?
			//		Callback to send to opened window.
			// openInExisting: Boolean?
			//		Open target in existing tab/window if possible.
			// reopenArgs: Object?
			//		Arguments used by tdi::returnToOpener() method in case that this window is reloaded.
			//		Should be used with "same" option and when `openInExisting` is true 
			//		(since this window can be the target one)
			// closeWithParent: Boolean?
			//		If true, newly opened window will be closes as soon as parnet window is closed.
			//		Has no use for "same" option.
			// returns: Deferred
			//		Promise resolves when opened window is closed.
			//		It has following extra properties:
			//
			//		- ready - promise that resolves when opened window is ready, window name is passed as argument
			//		- closed - promise that resolves when opened window is closed (just another reference to returned promise),
			//					return value (if any) is passed as argument
			//		- window - newly opened window; it is NOT advised to access its properties BEFORE `ready` was resolved 
			//					or AFTER `closed` was resolved 

			var d = new Deferred();
			d.ready = new Deferred();
			d.closed = d;

			var openFnc = this._options[option];
			if (!openFnc) {
				openFnc = this._options[this.defaultOption];
			}

			this._retValSet = false;
			features = features || (typeof this.defaultNewWinFeatures != "function" ? this.defaultNewWinFeatures : this.defaultNewWinFeatures());
			openInExisting = openInExisting != null ? openInExisting : this.defaultOpenInExisting;
			
			var openOptions = {
				url : uri,
				args : args,
				features : features,
				callback : callback,
				closeWithParent : closeWithParent,
				onReady : function(name) {
					d.ready.resolve(name);
				},
				onClose : function(args) {
					tdi._setRetVal.call(tdi, args);
					d.resolve(args);
					return args;
				}
			};
			
			try {
				var w;
				if (openInExisting) {
					w = this._options["existing"](openOptions, reopenArgs);
					if (w) { // not null means that existing window was indeed found
						d.window = w;
						return d;
					}
				}
				w = openFnc(openOptions, reopenArgs);
				d.window = w;
			} catch (err) {
				d.ready.reject(err);
				d.reject(err);
			}
			return d;
		},

		returnToOpener : function(retVal) {
			// summary:
			//		Return data to opener. 
			// description:
			//		If reopen args were passed to this page, they will be used to reopen parent
			//		page in this window. If not we expect that parent is opened in separate window and retVal will be sent to
			//		it via standard (return callback) means.
			// retVal: Object?
			//		Data to send to opener.
			var args = (wnd.getArguments() || {})[REOPEN_ARGS];
			if (args && args.uri) {
				// reopen original opener here
				var uri = args.uri;
				delete args.uri;
				args[RETURN_ARGS] = retVal;
				this.open("same", uri, args);
			} else {
				// send args and close
				wnd.returnValue(retVal);
			}
		},

		getArguments : function() {
			// summary:
			//		Access arguments sent to this window.
			// returns: Object
			//		Arguments sent to this window.

			var args = wnd.getArguments();
			// technical arguments are filtered out
			return blacklistMixin([
				REOPEN_ARGS,
				RETURN_ARGS
			], {}, args);
		},

		_setRetVal : function(value) {
			this._retValSet = true;
			this._retVal = value;
		},

		_retValSet : false,
		_retVal : null,

		setReturnValue : function(value) {
			wnd.setReturnValue(value);
		},

		getReturnValue : function() {
			// summary:
			//		Get value returned by child of this page. 
			return this._retValSet ? this._retVal : (wnd.getArguments() || {})[RETURN_ARGS];
		},

		parseFlags : function(flags) {
			// summary:
			//		Parses various formats of TDI options to array of strings.
			// flags: String[]|String|null
			//		protected
			// returns: String[]
			//		Array of TDI option keys.
			// example:
			//	|	// arrays are unchanged
			//	|	tdi.parseFlags(["same", "new"]);	// ["same", "new"]
			//	|	// strings are parsed to words
			//	|	tdi.parseFlags("newWin new");		// ["newWin", "new"]
			//	|	// "none" produces empty array
			//	|	tdi.parseFlags("none");				// []
			//	|	// "all" produces all TDI options
			//	|	tdi.parseFlags("all");				// ["same", "new", "newWin"]
			//	|	// any other values produces null
			//	|	tdi.parseFlags(null);				// null
			return flags instanceof Array ? flags : //
			flags == "none" ? [] : //
			flags == "all" ? this.optionKeys : //
			typeof flags == "string" ? lang.trim(flags).split(/\s+/) : //
			null; // defaults
		}
	};

	function addReopenArgs(openOptions, reopenArgs) {
		// summary:
		//		Pollutes openOptions rith reopen args if needed.
		
		// if RETURN_ARGS are present that means we already return to previous screen
		if (!(openOptions.args && openOptions.args[RETURN_ARGS])) {
			// if not returning - we setup future return
			openOptions.args = lang.mixin(openOptions.args, tdi._generateReopenArgs(reopenArgs));
		}
		return openOptions;
	}
	
	function generateReopenArgs(userArgs) {
		// summary:
		//		Generates arguments for reopening current screen.
		// description:
		//		Returns an object containing
		//		 - current query
		//		 - current tdi args
		//		 - any userArgs passed to this function
		//		 - current uri
		var args = {};
		args[REOPEN_ARGS] = lang.mixin({}, Uri.getQuery(null, true), tdi.getArguments(), userArgs, {
			uri : Uri.stripQuery(Uri.fromWindow())
		});
		return args;
	}
	
	// For monkey patching
	tdi._addReopenArgs = addReopenArgs;
	tdi._generateReopenArgs = generateReopenArgs;

	return tdi;
});