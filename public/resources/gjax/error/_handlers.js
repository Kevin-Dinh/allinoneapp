/**
 * Implementation of various error handler functions
 * including implementation of _windowOnError.
 *
 * Two methods are abstract: _displayDialog and _logError,
 * and expected to be implemented by calling application
 *
 * It shall be mixed into gjax/error object.
 *
 * Revisions:
 * 20120618	marcus	fix in chrome path of algorithm
 * 20120920 jukrop	add _logError - calling application may implement (for example) to log errors to DB
 * 20121210 marcus	comments + small refactors
 */
define([
	"dojo/_base/config",
	"dojo/_base/lang",
	"dojo/json",
	"dojo/Deferred",
	"gjax/registry",
	"gjax/_base/kernel",
	"dojo/has", // FF
	"dojo/_base/sniff" //FF, TODO: replace with uacs in 1.8+

], function(config, lang, json, Deferred, gregistry, gkernel, has) {

	var _this = {

		//new browsers now sends also 4th and 5th params to window.onerror
		//http://www.w3.org/html/wg/drafts/html/master/webappapis.html#onerroreventhandler
		//we will use 5th param ('error') for our original 'explicitEx';
		_windowOnError : function(sDesc, sUrl, sLine, sColumn, explicitEx) {
			console.debug("_windowOnError:", arguments);

			var err = _reconstruct(sDesc, sUrl, sLine, sColumn, explicitEx);
			err._isCaught = err._isRecoverable = false;
			_this._logError(err);

			_this._displayDialog(err).then(function(doReload) { //must be hitched //TODO: problem with deferred in window ?
				if (doReload) {
					_this.reload();
				} else if (!has("debug") && has("freezeAllOnError")) {
					//if not debug, freeze the screen
					gregistry.freezeAll("disabled", true, "fatal-error");
				}
			}, _this.errbackLog);
			return supressError();

			//-------------------------------------------------------------------------------------
			function supressError() {
				//this marks comments not to be added to dojo docs, because it conflicts with comments structrue
				/*=====
				// http://stackoverflow.com/questions/8087240/if-i-override-window-onerror-in-javascript-should-i-return-true-or-false
				// says
				// Chrome:  	false suppresses, true means propagate
				// MSIE, FF: 	true suppresses,
				// but from experiments it seems that Chrome is now alligned with MSIE A FF and behaves consitently
				// var suppressValue = has("chrome") ? false : true;
				//TODO: when tested all this function can be removed
				//TODO: study chrome bug report to the end
				//http://code.google.com/p/chromium/issues/detail?id=92062
				=====*/
				var suppressValue = true; //has("chrome") ? true : true;
				var propagateValue = !suppressValue; //TODO: test
				var r = config.supressWindowOnError ? suppressValue : propagateValue;
				console.debug("<error.supressError supress:", r === suppressValue);
				return r;
			}
			function _reconstruct(sDesc, sUrl, sLine, sColumn, explicitEx) {
				var r;
				if (explicitEx) {

					//TODO: remove serialized descriptions, not needed
					r = explicitEx;
					if (has("chrome")) { //TODO: only here for explicitEx ? or in general for all variants?
						_fixChromeError(r);
					}
					console.debug("common.error: _reconstructed from explicit ex");
				} else if (_supportsCatchInOnError()) { //FF fails here
					try {
						r = json.parse(sDesc);
						console.debug("common.error: _reconstructed from json description");
					} catch (ex) {
						// NEVER CALLED in FF on Mac //TODO: verify others, and non mac FF
						console.warn("common.error: _reconstruct failed");
					}
				}
				if (!r) { //FF path or reconstruct failed
					console.debug("common.error: _reconstruct from sDesc, sUrl, sLine");
					r = {
						line : sLine,
						message : sDesc, //TODO: verify if not too long
						description : sDesc,
						column : sColumn
					};
				}
				return r;

				function _supportsCatchInOnError() {
					//TODO: can we do feature detection for this ? see v4
					return !(!!has("ff"));
				}
				function _fixChromeError(err) {
					if (err.name == "TypeError" && err.type == "undefined_method" && lang.isFunction(err["arguments"][1])) { //hash access to ["arguments"] to avoid jshint
						err._message = err.message;
						err.message = err.message.replace(err["arguments"][1] + " ", ""); //hash access to ["arguments"] to avoid jshint
					}
				}
			}
		},

		reload : function() {
			window.onbeforeunload = null;
			location.reload();
		},

		// non fatal
		displayDialog : function(err) {
			// summary:
			//		Predefined function to display errors.
			//		Used in catch blocks for expected errors, that can be handled.
			//		User is not forced to reload page.
			// err: Error
			// returns: Deferred
			//		Signalling that the error dialog or other error display has been closed by user.
			err._isCaught = true;
			// promise returned
			return _this._displayDialog(err);
		},
		callbackNoop : gkernel.noop,
		callbackPass : gkernel.identity,
		// non fatal
		errbackDialog : function(err) {
			// summary:
			//		Predefined errback handler for Promise or callback API.
			//		Used for recoverable errors.
			//		User is not forced to reload page.
			// description:
			//		For detailed usage see samples and Development Guideline.
			// err: Error
			//
			_this._logError(err);
			// promise returned
			return _this.displayDialog(err);

		},
		errbackDialogFatal : function(err) {
			// summary:
			//		Predefined errback handler for Promise or callback API.
			//		Used for unexpected/unrecoverable errors.
			//		Displays error dialog and forces user to refresh the page.
			// description:
			//		For detailed usage see samples and Development Guideline.
			// err: Error
			//
			err._isRecoverable = false;
			_this._logError(err);
			// eats, next deferred not expected

			_this._displayDialog(err).then(function(doReload) {
				if (doReload) {
					_this.reload();
				} else if (!has("debug") && has("freezeAllOnError")) {
					//if not debug, freeze the screen
					gregistry.freezeAll("disabled", true, "fatal-error");
				}
			}, _this.errbackLog);
			//TODO: why not calling window.onerror.call ? or at least error._windowOnError or _this._catch(err);
			// using _displayDialog call  prevent's us from single capture point of uncaught exceptions
		},
		errbackLog : function(err) {
			// summary:
			//		Predefined errback handler for Promise or callback API.
			//		Logs the message in console.error
			//		Use only as last in the chain.
			// description:
			//		Application level code must override _logError
			// err: Error
			//
			_this._logError(err);
			// eats, next deferred not expected
			//TODO: not really used anywhere

		},
		tryCatchPromise : function(promiseOrValue) {
			// summary:
			//		Concenience "wrapper" around Promise.
			//		If promise fails (is rejected) , window.onerror handler is explicitly called (if registered)
			//		Usually used for unresolvable situations only ("last chance handler").
			// fnc: Promise | Object
			//		Promise to "wrap".
			//		If object is passed it is ignored.

			// eats, next deferred not expected, really use as last chance handler only
			if (promiseOrValue && typeof promiseOrValue.then == "function") {

				//console.debug(">tryCatchPromise");
				promiseOrValue.then(_this.callbackPass, function(err) {

					// TODO: or even wait for window.onerror (dialog) to return ?
					_this._catch(err);
					//console.debug("<tryCatchPromise errback");
					//TODO: maybe _this._catch is not enough here !, we may want to cancel the promise
					// however (if no other expected this is not needed)
				});
			}
			//ignoring non promises
		},
		tryCatchFunction : function(fnc) {
			// summary:
			//		Wrapper around original function.
			//		If function throws exception, window.onerror handler is explicitly called (if registered)
			// fnc: Function
			//		original function, function must remember it's own scope if needed (hitch)
			return function(/* args */) {
				//console.debug(">tryCatchFunction");
				try {
					var r = fnc.apply(null, arguments);
					//console.debug("<tryCatchFunction ok");
					return r;
				} catch (ex) {
					//console.debug(">tryCatchFunction ex:", ex);
					_this._catch(ex);
				}
			};
		},
		_catch : function(ex) {
			if (window.onerror != null) {
				//console.debug("gjax.error._catch(): routing to window.onerror");
				window.onerror.call(null, ex.message, "gjax.error._catch()", "explicit call to window.onerror", null, ex);
			} else {
				//console.error("gjax.error._catch(): no window.onerror rethrowing", ex);
				throw ex;
			}
		},
		_displayDialog : function(err) {
			// summary:
			//		Abstract. Called by displayDialog().
			//		Override on application level
			// tags:
			//		protected
			console.error("_displayDialog is abstract, override !. Orginal error for display:", err);
			//throw new Error("Abstract _displayDialog");
			var d = new Deferred();
			d.resolve(false); //simulating continue button, without page reload
			return d;
		},
		_logError : function(err) {
			// summary:
			//		Abstract.
			//		Override on application level
			// tags:
			//		protected
			console.error("_logError is abstract, override !. Orginal error for logging:", err);
			//throw new Error("Abstract _logError");
		}

	};
	//backcompat, TODO: remove
	_this.capture = _this.tryCatchFunction;
	return _this;
});
