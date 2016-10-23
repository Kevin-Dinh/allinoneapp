define([
	"require",
	"dojo/dom",
	"dojo/_base/event",
	"dijit/registry",
	"dojo/query",
	"gjax/registry/debug",
	"dojo/on",
	"dojo/cookie",
	"gjax/tdi",
	"gjax/uri/Uri",
	"dojo/dom-construct",
	"dojo/ready",
	"dojo/aspect",
	"gjax/error",
	"put-selector/put",
	"xstyle/css!./_debug.css"
], function(_require, dom, event, registry, query, rDebug, on, cookie, tdi, Uri, domConstruct, ready, aspect, error, put) {

	var COOKIE_PATH = Uri.resolveUiCtx("/");

	on(document, "keydown", function(e) {
		var character = String.fromCharCode(e.keyCode);
		if (e.ctrlKey && character == "G") {
			event.stop(e);
			var uri = Uri.resolveUiCtx("/tools/ui/docs/views-dependencies");
			uri = Uri.setQuery(uri, {
				screenUri : Uri.getPath()
			});
			tdi.open("new", uri);
			return;
		}
		if (e.ctrlKey && e.altKey && character == "D") {
			event.stop(e);
			toggleDevTools();
			return;
		}
		if (e.ctrlKey && e.altKey && character == "Q") {
			event.stop(e);
			toggleFindWidget();
			return;
		}
	});

	var debugTools;
	var debToolsLinkPaused;
	var errors = [];

	var parentNode = put(window.document.body, "div");

	ready(function() {
		if (!parentNode) {
			console.debug("Dev tools could not be initialized");
		} else {
			var devToolsLink = domConstruct.create("a", {
				className : "debug-icon dev-tools animated pulse",
				href : "#",
				title : "Toggle debug tools (CTRL+ALT+D)" /* git-qa */
			}, parentNode);
			on(devToolsLink, "click", toggleDevTools);
			var findWidgetLink = window.findWidgetLink = domConstruct.create("a", { /* git-qa */
				className : "debug-icon find-widget start animated pulse",
				href : "#",
				title : "Find widget (CTRL+ALT+Q)" /* git-qa */
			}, parentNode);
			on(findWidgetLink, "click", toggleFindWidget);
		}
	});

	//hook to error displaying, so we can display it also in debug console
	ready(71 /*Right after dijit dialog is pluged into erro handling*/, function() {
		aspect.after(error, "_displayDialog", _logError, true);
	});

	//if dev tools should be opened, wait for ready and open them
	ready(function() {
		var openDebugTools = cookie("debugTools");
		if (openDebugTools && registry.byId("baseContainer")) {
			toggleDevTools();
		}
	});

	//until the debug console is first time shown, keep the errors in the stack
	//errors.push method will be overriden by debugTools when it is loaded 
	//REVIEW: please review this pattern;
	function _logError(e) {
		e._timestamp = new Date();
		errors.push(e);
	}

	function toggleDevTools(e) {
		/*jshint expr:true */
		e && event.stop(e);

		if (debToolsLinkPaused) {
			return;
		}
		if (!debugTools) {
			debToolsLinkPaused = true;
			require([
				"tools/debug-tools/debugTools"
			], function(_debugTools) {
				debugTools = _debugTools;
				debugTools.errorStack = errors; //set reference to errors stack
				var displayed = debugTools.toggle();
				setCookie(displayed);

				debToolsLinkPaused = false;
			});
		} else {
			var displayed = debugTools.toggle();
			setCookie(displayed);

		}

		function setCookie(displayed) {
			if (displayed) {
				cookie("debugTools", "on", {
					path : COOKIE_PATH
				});
			} else {
				cookie("debugTools", null, {
					path : COOKIE_PATH,
					//unset cookie
					expires : -1
				});
			}

		}
	}

	var fw;
	function toggleFindWidget(e) {
		/*jshint expr:true */
		e && event.stop(e);
		if (fw) {
			//if findWidget module was already loaded, just call toggle method
			fw.toggle();
		} else {
			//otherwise load findWidget module, which will also cause calling toggle, in factory
			_require([
				"dojo/ready",
				"./findWidget" //loading this module will also cause activating it
			], function(ready, findWidget) {
				fw = findWidget;
				ready(function() {
					findWidget.onActive = onActive;
					onActive(true);/*when script is loaded first time its already running*/
					function onActive(active) {
						/*jshint expr:true*/
						window.findWidgetLink && put(window.findWidgetLink, active ? "!record.stop" : ".record!stop");
					}
				});
			});
		}
	}

});
