/**
 * testcase/demo available at: http://localhost:8080/unius/samples/ui/samples/gjax-wnd
 */
/*jshint expr:true */
/*global wnd:true*/
define([
	"dojo/json",
	"dojo/_base/lang",
	"dojo/_base/config",
	"dojo/on",
	"gjax/_base/kernel", //gjax.asrt
	"gjax/uri/Uri",
	"gjax/storage",
	"dojo/i18n!./nls/wnd",
	"dojox/lang/functional",
	"gjax/error",
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/array", // array.indexOf
	"dojo/_base/window",
	"dojo/dom-construct",
	"dojox/lang/functional/fold" // df.reduce
], function(json, lang, config, on, gkernel, Uri, storage, i18n, df, error, kernel, array, win, domConstruct) {

	// module:
	//		gjax/wnd

	var PROPERTY_OPENER = "gjax.wnd._opener", //
		PROPERTY_WINDOWMODE = "gjax.wnd._windowMode", //
		PROPERTY_ARGUMENTS = "gjax.wnd._arguments", //
		PROPERTY_CALLBACK = "gjax.wnd._callback", //
		PROPERTY_READY_CALLBACK = "gjax.wnd._readyCallback", //
		PROPERTY_CLOSE_CALLBACK = "gjax.wnd._closeCallback"; //

	var STORAGE_NAMESPACE = storage.encodeNamespace(config.uiCtxPrefix + "-gjax-wnd");

	//references to closed windows are cleared in regular interval to minimize retained memory
	//and allow garbage collector to free it
	var CLEAR_CLOSED_WINDOWS_INTERVAL = 2000;

	var asrt = gkernel.asrt,
		sRe = /\s/,
		sdRe = /[\s\-]/;

	function toJson(o) {
		return json.stringify(o);
	}

	function fromJson(str) {
		return str && json.parse(str);
	}

	function wrapFn(callback) {
		return function(dataJson) {
			var dataObj = fromJson(dataJson);
			var returnObj = callback(dataObj);
			return toJson(returnObj);
		};
	}

	function unwrapFn(wrappedCallback) {
		return function(dataObj) {
			var dataJson = toJson(dataObj);
			var returnJson = wrappedCallback(dataJson);
			return fromJson(returnJson);
		};
	}

	function isObj(o) {
		return o != null && typeof o == "object";
	}

	function generateName() {
		return "_blank_" + (new Date().valueOf() + Math.floor(Math.random() * 100));
	}

	// module export
	// creates global object (!) it is needed for inter-screen communication
	wnd = {
		// summary:
		//		Static convenience methods for window interaction.
		WM_MODALDIALOG : "MODAL",
		WM_MODELESSDIALOG : "MODELESS",
		WM_WINDOW : "WINDOW",
		DEFAULT_FEATURES : "", // NTH sensible defaults, make demo for setting app scope
		DEFAULT_FEATURES_WO : "menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,width=800,height=600",

		_handleCloseSetUp : false,

		_wnds : [],
		_wndsToClose : [],
		_wndsArgs : {},

		_wndsOrphans : [],
		_wndAncestor : null, // used to manage wnds with closed opener

		// _returnValue: Any
		//		Value to return when this window is closed
		_returnValue : null,

		isPopup : function() {
			// summary:
			//		Returns true if window was opened by window.open, showModalDialog or showModelessDialog, or open new tab etc...
			//		Or generally if window has opener + fix for MSIE showModalDialog,showModelessDialog with null opener.
			// returns: Boolean
			return window.opener || "dialogArguments" in window;
		},
		isIframe : function() {
			// summary:
			//		True if the current window is iframe.
			// returns: Boolean

			// must be == (not === nor !==)
			// see http://ainthek.blogspot.com/2010/07/comparing-window-references.html
			/*jshint -W018*/
			return !window.opener && !(window == window.parent);
			/*jshint +W018*/
		},
		isDialog : function() {
			// summary:
			//		True for windows opened with window.showModal or window.showMedelessDialog.
			//		False of other popups (link in new tab, window open).
			// returns: Boolean
			return "dialogArguments" in window;
		},
		// NTH: isBrandNew (nebolo otvorene z linky, neni v iframe, atd...., nema history ?)
		isModalDialog : function() {
			// summary:
			//		So far undetectable for window.show*, reliable only for wnd.show* API
			// returns: Boolean

			// NTH: can we hack this (without sniffing) for window.show* api as well?
			return this.isDialog() && this.getPopupMode() == this.WM_MODALDIALOG;
		},
		getOpener : function() {
			// summary:
			//		Returns window or null.
			//		XB version of window.opener, working also for MSIE modal and modeless dialogs.
			//		If opened with wnd.show*Dialog.
			// returns: Window|null

			// http://www.shaftek.org/blog/2005/05/05/browser-differences-in-windowopener-behavior/
			if (window.opener && !window.opener.closed) {
				try {
					if (typeof window.opener.name == "string") {
						return window.opener;
					}
				} catch (e) {
					// In case opener is from other origin, we do not return it (not interested in such opener in any case).
					// This prevents following errr (thrown when accessing opener.name)
					// 		SecurityError: Blocked a frame with origin <current> from accessing a frame with origin <opener origin>.
					return null;
				}
			}
			if ("dialogArguments" in window && window.dialogArguments) {
				return window.dialogArguments[PROPERTY_OPENER];
			}
			return null;
		},
		hasOpenedOpener : function() {
			var w = this.getOpener();
			return w && !w.closed && w.name != window.name;
		},
		getPopupMode : function() {
			asrt(this.isPopup(), "IllegalState, call allowed only for isPopup=true");
			var r = this.isDialog() ? window.dialogArguments[PROPERTY_WINDOWMODE] : r = this.WM_WINDOW; // TODO: design or bug ? this means also click mode not only window.open ?
			asrt(r != null, "IllegalUsage, getPopupMode returns null, use wnd.show* API instead");
			return r;
		},
		_serializeFeatures : function(features) {
			// summary:
			//		Serializes window features from object to string.
			if (features == null || !isObj(features)) {
				return features; // null returns null. {} returns "".
			}
			var a = df.reduce(features, function(arr, v, k) {
				arr.push(k + "=" + (typeof v == "boolean" ? (v ? "yes" : "no") : v));
				return arr;
			}, []);
			return a.join(",");
		},
		showModalDialog : function(url, args, features, callback) {
			// summary:
			//		Replacement for window.showModalDialog, implements empty {} as args, implements default features.
			// description:
			//		APIs:
			//		- http://developer.apple.com/safari/library/documentation/appleapplications/reference/WebKitDOMRef/DOMWindow_idl/Classes/DOMWindow/index.html#showModalDialog
			//		- https://developer.mozilla.org/en/DOM/window.showModalDialog
			//		Remarks: Side effects: modifies args object (appends opener, _windowMode)
			// returns: Object
			//		Return value from dialog.

			kernel.deprecated("gjax/wnd::showModalDialog() is deprecated. Use gjax/wnd::open or dijit/Dialog instead.", "", "2.0");

			asrt(args == null || typeof args == "object", "IllegalArgument, args type: " + typeof args);
			asrt(callback == null || typeof callback == "function", "IllegalArgument, callback type: " + typeof callback);

			features = this._serializeFeatures(features) || this.DEFAULT_FEATURES;
			asrt(!sRe.test(features), "IllegalArgument, features cannot contain any blank spaces");

			args = args || {};

			var wrap = {};
			wrap[PROPERTY_OPENER] = window;
			wrap[PROPERTY_WINDOWMODE] = this.WM_MODALDIALOG;
			wrap[PROPERTY_CALLBACK] = callback ? wrapFn(callback) : null;
			wrap[PROPERTY_ARGUMENTS] = toJson(args); //original arguments object as json

			// features = this._createDialogPosition(features)
			var retValJson = window.showModalDialog(url, wrap, features);
			return fromJson(retValJson);
		},
		open : function(url, args, name, features, closeWithParent, callback, readyCallback, closeCallback, usePost) {
			// summary:
			//		Enhanced window.open function.
			//
			//		Parameters can be send to window using args and
			//		window can be autoclosed if opener is closed. Variety aff callbacks can be used as well
			//		(max one input argument is allowed per callback).
			// url: String
			//		URL to open.
			// args: Object?
			//		Arguments to send to opened window. Use wnd.getArguments() to access them from that window.
			// name: String?
			//		Window name. No blank spaces or dashes permitted. Null, "" and "_blank" cause autogeneration of window name.
			//
			//		Value of "_self" will cause that new page will be opened in this window.
			//		Currently, using `usePost` parameter will always chenge this parameter to "_self".
			// features: String?|Object?
			//		Window features as string or object. No blank spaces permitted. If null or not provided, default features will be used.
			//		Note: Using "" for features causes URL to open in new tab.
			// closeWithParent: Boolean?
			//		When true, opened window will automatically close when opener window closes.
			// callback: Function?|Object?
			//		Callback to send to opened window. Use wnd.doCallback() to execute it from that window.
			//		Alternatively can also
			// readyCallback: Function?
			//		Callback to send to opened window. Will be called automatically when that window is loaded.
			// closeCallback: Function?
			//		Callback to send to opened window. Will be called automatically when that window is closed (in any way, including refresh).
			// usePost: Boolean?
			//		When true, POST is used for this navigation. Currently, window will be always reloaded when using POST!
			// returns: Window
			//		Opened window.
			// description:
			//		See orginal documentation for details:
			//
			//		- https://developer.mozilla.org/en/window.open
			//		- http: //msdn.microsoft.com/en-us/library/ms536651(VS.85).aspx
			//
			//		There are two ways to call this method, the old way:
			//	|	wnd.open(url, args, name, features, closeWithParent, callback, readyCallback, closeCallback);
			//		and the new way:
			//	|	wnd.open({
			//	|		url: url,
			//	|		args: args,
			//	|		name: name,
			//	|		features: features,
			//	|		closeWithParent: closeWithParent,
			//	|		callback: callback,
			//	|		onReady: readyCallback,
			//	|		onClose: closeCallback
			//	|	});
			//
			//		The advantage of 'the new way' is that, for example, when only callback needs to be specified,
			//		you don't need to *skip* all unwanted arguments:
			//	|	wnd.open(url, null, null, null, null, callback);
			//		Instead just write:
			//	|	wnd.open({
			//	|		url: url,
			//	|		callback: callback
			//	|	});

			/*jshint maxcomplexity:30 */
			
			this._clearClosedWindows();

			if (isObj(url)) {
				// resolve arguments
				var options = url;
				url = options.url;
				args = options.args;
				name = options.name;
				features = options.features;
				closeWithParent = options.closeWithParent;
				callback = options.callback;
				readyCallback = options.onReady;
				closeCallback = options.onClose;
				usePost = options.usePost;
			}

			asrt(args == null || typeof args == "object", "IllegalArgument, args type: " + typeof args);
			asrt(callback == null || typeof callback == "function" || typeof callback == "object", "IllegalArgument, callback type: " + typeof callback);
			asrt(readyCallback == null || typeof readyCallback == "function", "IllegalArgument, readyCallback type: " + typeof readyCallback);
			asrt(closeCallback == null || typeof closeCallback == "function", "IllegalArgument, closeCallback type: " + typeof closeCallback);
			asrt(!sdRe.test(name), "IllegalArgument, name cannot contain any blank spaces or dashes"); // dashes are problematic in IE9 only

			if (usePost) {
				// POST will always cause reload
				name = "_self";
			}

			// resolve name
			if (!name || name == "_blank") {
				name = generateName();
			} else if (name == "_self") {
				// keep same name
				name = window.name;
			}
			var reload = name == window.name;

			var wrap = {};
			// resolve arguments
			wrap[PROPERTY_ARGUMENTS] = toJson(args); //original arguments object as json

			// NOTE: callbacks are irrelvant when opening in same window (will be inaccesible)
			// features are also useless
			if (!reload) {

				// resolve features
				features = this._serializeFeatures(features);
				// allow empty string - defaults will always open window in FF/Chrome (instead of tab)
				features != null || (features = this.DEFAULT_FEATURES_WO);
				asrt(!sRe.test(features), "IllegalArgument, features cannot contain any blank spaces");

				// resolve callbacks
				if (isObj(callback)) {
					// if more callbacks, wrap them all
					var c = wrap[PROPERTY_CALLBACK] = {};
					for (var k in callback) {
						asrt(callback[k] == null || typeof callback[k] == "function", "IllegalArgument, callback type: " + typeof callback[k]);
						c[k] = callback[k] ? wrapFn(callback[k]) : null;
					}
				} else {
					wrap[PROPERTY_CALLBACK] = callback ? wrapFn(callback) : null;
				}
				wrap[PROPERTY_READY_CALLBACK] = readyCallback ? wrapFn(readyCallback) : null;
				wrap[PROPERTY_CLOSE_CALLBACK] = closeCallback ? wrapFn(closeCallback) : null;
			}
			// persist data for child
			this._wndsArgs[name] = wrap;

			if (reload) { // this script will be realoaded
				// persist data using storage
				this._saveTemp();
				// remove all my data after unload - so when I reload, my new "self" won't get them from parent
				this.addWindowCloseHandler(lang.hitch(this, "_deleteWrap"));
			}

			var w = null;
			try {
				// open child
				if (!usePost) {
					w = window.open(url, name, features);
				} else {
					w = window;
					this._doPost(url, name);
				}
			} catch (error) {
				console.log(error);
				return window;
			}
			if (w == null) {
				// delete args
				delete this._wndsArgs[name];
				storage.remove(this._getStorageKey(), STORAGE_NAMESPACE);
				// most likely cause: popup blocker
				throw error.newUserError(new Error(), i18n.msgCheckPopupBlocker, null, "gjax/wnd", "PopupBlockerException");
			}

			if (!reload) { // dont register new window, when reloading
				this._wnds.push(w);
				if (!this._handleCloseSetUp) { // hook only once
					wnd.addWindowCloseHandler(lang.hitch(this, this._handleClose));
					this._handleCloseSetUp = true;
				}
				if (closeWithParent) {
					this._wndsToClose.push(w); // NTH maybe set some flag? dont save wnd in another array
				}
			}

			w.focus();
			return w;
		},

		_clearClosedWindows : function() {
			function clear(windowArray) {
				var closedWindows = array.filter(windowArray, function(w) {
					return w.closed;
				});
				array.forEach(closedWindows, function(closedWindow) {
					windowArray.splice(array.indexOf(windowArray, closedWindow), 1);
					if (this._wndsArgs && closedWindow.name) {
						delete this._wndsArgs[closedWindow.name];
					}
				}, this);
			}
			clear(this._wnds);
			clear(this._wndsToClose);
			clear(this._wndsOrphans);
		},

		_doPost : function(url, name) {
			// use form to make POST request
			var form = domConstruct.create("form", {
				action : url,
				method : "post",
				target : name
			}, win.body(), "last");
			form.submit();
		},
		close : function(keepCloseMsg) {
			// summary:
			//		Closes current window.
			// description:
			//		By default suppresses any closing messages.
			// keepCloseMsg: Boolean?
			//		If true, current closing message will not be suppressed.
			if (keepCloseMsg) {
				this.askBeforeClose(null);
			}
			window.close();
		},
		askBeforeClose : function(question) {
			// summary:
			//		Sets question to be shown before window is closed/reloaded. Native browser dialog is shown with browser
			//		provided buttons: Stay or Leav
			// question: String?
			//		Question to show. Falsy value turns this feature off.
			window.onbeforeunload = question ? function(evt) { /* git-qa */
				evt = evt || window.event;
				if (evt) {
					evt.returnValue = question;
				}
				return question;
			} : null;
		},
		_getWrap : function() {
			// summary:
			//		Returns all data saved for this window by its opener (arguments and callback).
			// returns: Object
			//		Data.
			// tags:
			//		private
			if (this.isDialog()) {
				asrt(window.dialogArguments, "IllegalState, dialog without dialogArguments");
				return window.dialogArguments;
			} else {
				try {
					var opener = this._getAncestor() || window; // if no opener look in myself
					// NOTE: when screen refreshes opener == window but in IE opener == null
					if (opener && opener.wnd) {
						var wrap = opener.wnd._wndsArgs[window.name];
						if (wrap == null) {
							// if no data in opener, look in myself (may have been reload)
							wrap = this._wndsArgs[window.name];
						}
						return wrap;
					}
				} catch (ex) {
					//debugger;
				}
			}
			return null;
		},
		getArguments : function() {
			// summary:
			//		Extended version of dialogArguments also for windows opened with wnd.open().
			//		Returns non null Object, even if not dialog, no opener or opener disconnected.
			// returns: Object
			//		Arguments sent to this window.
			var wrap = this._getWrap();
			if (!wrap) {
				return null;
			}
			var args = wrap[PROPERTY_ARGUMENTS];
			return fromJson(args);
		},
		doCallback : function(args, callbackName) {
			// summary:
			//		Call to execute the callback(s) passed to wnd.open() when this window was opened.
			// args: Any?
			//		Argument to pass to callback. Must be serializable to json!
			// callbackName: String?
			//		Name of callback to execute, used in case that more callbacks were passed to wnd.open().
			//		If not present, all callbacks are called in undefined sequence;
			// returns: Object|null
			//		Return value from callback.

			function isCallable(o) {
				// NOTE: typeof function is not enough
				// when accessing cross-window function in IE 9, its typeof is actually object (!)
				// We therefore do another check using instanceof
				return o && (typeof o == "function" || (o instanceof (wnd.getOpener() || window).Function));
			}

			var wrap = this._getWrap();
			if (!wrap) {
				return null;
			}
			var wrappedCallback = wrap[PROPERTY_CALLBACK];

			if ((isObj(wrappedCallback) && !isCallable(wrappedCallback)) || callbackName) {
				if (callbackName) {
					// if no callback name, call specified callback (or no callback if it does not exist)
					wrappedCallback = (wrappedCallback || {})[callbackName];
				} else {
					// if no callback name, call all callbacks and return all results
					return df.mapIn(wrappedCallback, function(callback) {
						return callback ? unwrapFn(callback)(args) : null;
					});
				}
			}
			return wrappedCallback ? unwrapFn(wrappedCallback)(args) : null;
		},
		setReturnValue : function(value) {
			// summary:
			//		Sets window.returnValue property for modal dialogs.
			//
			//		For windows opened by wnd.open(), value will be returned by callback on window close.
			// value: Any
			//		Value to return from dialog or send to callback.
			if (this.isModalDialog()) {
				window.returnValue = toJson(value); /* git-qa */
			} else {
				this._returnValue = value;
			}
		},
		returnValue : function(value) {
			// summary:
			//		Sets window.returnValue property for modal dialogs OR executes
			//		callback for windows. Then closes this dialog/window.
			// value: Any
			//		Value to return from dialog or send to callback.
			//		Current return value will be left unaffected if `value` is undefined
			if (value !== undefined) {
				this.setReturnValue(value);
			}
			this.close();
		},
		findWndsByUri : function(uri) {
			// summary:
			//		Use to find a window in which `uri` is opened.
			// uri: String
			//		URI to search for.
			// returns: Window|null
			//		First window with location equal to `uri`.

			// TODO when opener == window, we cannot find anything!

			var root = window, ancestor = this._getAncestor();
			// find root
			while (ancestor && ancestor.wnd && root.name != ancestor.name) {
				root = ancestor;
				ancestor = ancestor.wnd._getAncestor();
			}
			try {
				// check root itself
				if (Uri.equals(uri, Uri.fromWindow(root))) {
					return root;
				}
				// search descendants
				return root.wnd._findWnds(Uri.toString(uri)); // ensure string before sending around
			} catch (e) {
				// In case opener is from other origin, we cannot do any window lookup).
				// This prevents following err (thrown in Uri.fromWindow)
				// 		SecurityError: Blocked a frame with origin <current> from accessing a frame with origin <opener origin>.
				return null;
			}
		},
		_getAncestor : function() { // getOpener is not enough to manage orpanded wnds
			return this._wndAncestor && !this._wndAncestor.closed ? this._wndAncestor : this.getOpener();
		},
		_findWnds : function(uri) {
			var w, i, wnds = this._wnds.concat(this._wndsOrphans);
			// search children & orphans
			for (i = 0; i < wnds.length; i++) {
				w = wnds[i];
				if (w.closed) {
					continue;
				}
				if (Uri.equals(uri, Uri.fromWindow(w))) {
					return w;
				}
				// go deeper
				if (w.wnd) {
					var result = w.wnd._findWnds(uri);
					if (result) {
						return result;
					}
				}
			}
			return null;
		},
		_handleClose : function() {
			// summary:
			//		Close handler for this window.
			// tags:
			//		private
			this._closeWindows();
			// get opener/ancestor
			var ancestor = this._getAncestor();

			var w, i = 0, wnds = this._wnds.concat(this._wndsOrphans), aName;
			// if ancestor not available (this is root) use one of children
			while ((!ancestor || (aName == window.name)) && i < wnds.length) {
				w = wnds[i++];
				if (w && !w.closed) {
					ancestor = w;
					try {
						aName = ancestor.name;
					} catch (e) {
						aName = window.name;
					}
				}
			}
			try {
				// transfer pointers to remaining open children (and orphans) to opener/ancestor
				if (ancestor && !ancestor.closed && ancestor.wnd) {
					for (i = 0; i < wnds.length; i++) {
						w = wnds[i];
						if (!w.closed && w.name != ancestor.name) {
							ancestor.wnd && ancestor.wnd._registerOrphan(w, this._wndsArgs[w.name]);
						}
					}
				}
			} catch (ex) {
				// debugger;
			}
		},
		_closeWindows : function() {
			// summary:
			//		Close all child windows that should be closed with parent.
			// tags:
			//		private
			var chW, i;
			for (i = 0; i < this._wndsToClose.length; i++) {
				chW = this._wndsToClose[i];
				if (!chW.closed) {
					var name = chW.name;
					try {
						// may fail if navigated away (X-site)
						chW.wnd ? chW.wnd.close() : chW.close();
					} finally {
						this._wndsToClose[i] = null; // Am I paranoid ?
						delete this._wndsArgs[name];
					}
				}
			}
			this._wndsToClose = null;
		},
		_registerOrphan : function(w, args) {
			this._wndsOrphans.push(w);
			this._wndsArgs[w.name] = args;
			if (w.wnd) {
				w.wnd._wndAncestor = window;
			}
			if (!this._handleCloseSetUp) { // hook only once
				wnd.addWindowCloseHandler(lang.hitch(this, this._handleClose));
				this._handleCloseSetUp = true;
			}
		},
		_getStorageKey : function() {
			return storage.encodeKey(window.name);
		},
		_saveTemp : function() {
			// save _wndsArgs using local storage (because this script will be reloaded)
			// TODO is there is no way to save _wndsToClose etc? all such data will be lost when refreshing
			var data = this._wndsArgs;
			try {
				storage.put(this._getStorageKey(), data, STORAGE_NAMESPACE);
			} catch (e) {
				error.errbackDialogFatal({
					message : i18n.msgStorageError
				});
			}
		},
		_loadTemp : function() {
			// if current screen replaced its parent, that parent left it some data in local storage
			var data;
			try {
				data = storage.get(this._getStorageKey(), STORAGE_NAMESPACE);
			} catch (e) {
				error.errbackDialogFatal({
					message : i18n.msgStorageError
				});
			}
			if (data != null) {
				this._wndsArgs = data;
				// keep data in storage, in case this screen is reloaded, could be deleted manualy by wnd.clearData(true)
			}
		},
		_deleteWrap : function() {
			// summary:
			//		Clears all data saved for this window by its opener (arguments and callback).
			// returns: Boolean
			//		True if data was deleted or not present.
			// tags:
			//		private
			try {
				var opener = this._getAncestor() || window; // if no opener look in myself
				// NOTE: when screen refreshes opener == window but in IE opener == null
				if (opener && opener.wnd) {
					delete opener.wnd._wndsArgs[window.name];
				}
				return true;
			} catch (ex) {
				//debugger;
				return false;
			}
		},
		clearData : function(clearAll) {
			// summary:
			//		Clears all stored data associated with this window.
			// clearAll: Boolean?
			//		If true, clears all wnd-related data from local storage (not only for this window)
			this._deleteWrap();
			if (clearAll) {
				storage.clear(STORAGE_NAMESPACE);
			} else {
				storage.remove(this._getStorageKey(), STORAGE_NAMESPACE);
			}
		},

		_doCloseCallback : function() {
			var args = typeof this._returnValue == "function" ? this._returnValue.call() : this._returnValue;
			var wrap = this._getWrap();
			if (!wrap) {
				return null;
			}
			var wrappedCallback = wrap[PROPERTY_CLOSE_CALLBACK];
			return wrappedCallback ? unwrapFn(wrappedCallback)(args) : args;
		},
		_doReadyCallback : function() {
			var wrap = this._getWrap();
			if (!wrap) {
				return null;
			}
			var wrappedCallback = wrap[PROPERTY_READY_CALLBACK];
			return wrappedCallback ? unwrapFn(wrappedCallback)(window.name) : null;
		},
		_init : function() {
			// make sure this window has non-empty name
			if (!window.name) {
				window.name = generateName(); /* git-qa */
			}
			// get arguments stored by parent (in case of opening in same window)
			this._loadTemp();
			// at least data for my children will be preserved when I reload
			this.addWindowCloseHandler(lang.hitch(this, "_saveTemp"));
			// setup close handler with default closeCallback
			this.addWindowCloseHandler(lang.hitch(this, "_doCloseCallback"));
			// run readyCallback
			this._doReadyCallback();

			setInterval(this._clearClosedWindows.bind(this), CLEAR_CLOSED_WINDOWS_INTERVAL);
		}
	};
	(function() {
		// XB addWindowCloseHandler
		var handlers = [], listeners = [], fired, registered;

		function listen(/*evt*/) {
			if (fired) {
				return;
			}
			fired = true;
			for (var i = 0; i < listeners.length; i++) {
				listeners[i]();
			}
			for (i = 0; i < handlers.length; i++) {
				handlers[i].remove();
			}
		}
		function addWindowCloseHandler(listener) {
			// summary:
			//		XB handler fired when page is closed or navigated away.
			//		Implementation uses the best attempt strategy and registers on all possible events.
			//		pagehide, unload to fight with Fast Caches, Page Caches or whatever they call it.
			//		Opera refuses to fire event on window close, and works only on navigate away.
			if (!registered) {
				handlers[0] = on(window, "pagehide", listen);
				handlers[1] = on(window, "unload", listen);
				registered = true;
			}
			listeners.push(listener);

			return {
				remove : function() {
					var i = array.indexOf(listeners, listener);
					if (i > -1) {
						listeners.splice(i, 1);
					}
				}
			};
		}
		// exports
		wnd.addWindowCloseHandler = addWindowCloseHandler;
	}());

	wnd._init();

	return wnd;
});
