define([
	"dojo/Deferred",
	"dojo/query",
	"dijit/registry"
], function(Deferred, query, registry) {
	function waitFor(condition, timeout, pollInterval) {
		var d = new Deferred();
		/*jshint expr:true */
		pollInterval || (pollInterval = 100);
		timeout || (timeout = 10000);
		var endTime = new Date().valueOf() + timeout, //
		errs, //condition eval errors
		c, // condition eval result (can be object)  
		check = function() {
			try {
				c = condition();
				console.debug("waitFor.condition", c);
			} catch (ex) {
				console.debug("waitFor.condition.error:", ex);
				(errs = (errs || [])).push(ex);
			}
			if (c) {
				d.resolve(c); //receives condition result (ca be {})
			} else if (new Date().valueOf() < endTime) {
				setTimeout(check, pollInterval);
			} else { //else if (onTimeout) {
				(errs = (errs || [])).push(new Error("waitFor.timeout after:" + timeout));
				d.reject(errs); //receives err result (null or non empty [] of Error)
			}
		};
		check();
		return d;
	}

	waitFor.conditions = waitFor.c = {
		documentChanged : function(wnd) {
			var _oldDoc = wnd.document;
			return function condition$documentChanged() {
				try {
					return wnd.document !== _oldDoc ? wnd.document : null;
				} catch (exSopOrIE9) {
					// MSIE 9 fails when accessing _oldDoc after iframe reload, even if single policy is ok, 
					// that case is considered as change as well
					try {
						return wnd.document; //but wnd.document (new document seems acessible)
					} catch (exSop) {
						// can fail in all browsers because of Single Origin Policy
						// and new document is not accessible
						return null;
					}
				}
			};
		},
		testId : function(testId) {
			var nodes = query("[testId=" + testId + "]");
			console.log("TESTID:", testId);
			console.log("TESTID, nodes.length:", nodes.length);
			console.log("TESTID, guiBlockingStandby:", !registry.byId("guiBlockingStandby").isVisible());
			if (nodes.length > 0 && !registry.byId("guiBlockingStandby").isVisible()) {
				var w = registry.getEnclosingWidget(nodes[0]);
				return (w && !w.disabled) ? w : false;
			}
			return false;
		},
		gridFetchComplete : function(grid) {
			return grid._isLoaded;
		}
	};
	return waitFor;
});