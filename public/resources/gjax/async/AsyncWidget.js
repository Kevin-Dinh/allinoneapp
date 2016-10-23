define([
	"dojo/_base/declare",
	"dojo/Deferred",
	"gjax/async/require",
	"dojo/_base/lang",
	"gjax/error"
], function(declare, Deferred, asyncRequire, lang, error) {

	return declare(Deferred, {
		// summary:
		//		Wrapper for widget which will be loaded asynchronously on widget construction.
		// description:
		//		Deferred subclass, which provides also widget API, constructed with widget MID 
		//		and resolved to widget instance.
		//		Use to create lazy loaded widgets.
		// example:
		//		| var w = new AsyncWidget("dijit/form/Button", {
		//		| 	label : "foo"
		//		| });
		//		| w.placeAt("testNode").startup();
		//		| w.on("click", myClickHandler);
		//		| 
		//		| 
		//		| var w = new AsyncWidget(_require, "./FooWidget", [
		//		| "./_FooMixin"
		//		| ]);
		//		| w.placeAt("testNode").startup();
		//		| w.then(function(widgetInstance) {
		//		| 	// 
		//		| });

		"-chains-" : {
			constructor : "manual"
		},

		// customErrorHandling: Boolean
		//		If set to true, errors that occures during widget creation will be propagated as promise rejections
		//		If false (default) - errbackDialogFatal will be used as handler
		//		For errors in other methods (set, placeAt, startup, destroy), custom handling is not provided, errbackDialogFatal will be used. 
		customErrorHandling : false,

		constructor : function(contextRequire, mid, mixins, params, srcNodeRef) {
			// summary:
			//		Constructor
			// contextRequire: function?
			//		Context require, optional attribute, needed if mid or one of mixins is relative
			// mid: String
			//		MID of desired widget
			// mixins: array
			//		Optional array of mids (strings) of mixins that will be loaded and mixed into widget
			// params: object
			//		Optional parameters for widget constructor
			// srcNodeRef: DOMNode|String?
			//		If specified, will be used as srcNodeRef in widget constructor
			// returns:	Promise
			//		A description of what the function returns
			this.inherited(arguments, [
				this._cancelar
			]);

			if (!lang.isFunction(contextRequire)) {
				srcNodeRef = params;
				params = mixins;
				mixins = mid;
				mid = contextRequire;
				contextRequire = null;
			}
			if (!lang.isArray(mixins)) {
				srcNodeRef = params;
				params = mixins;
				mixins = null;
			}

			var mids = [
				mid
			];

			if (mixins) {
				mids = mids.concat(mixins);
			}

			asyncRequire(mids, contextRequire).then(lang.hitch(this, function(classes) {
				if (this._destroyed) {
					return null;
				}

				var Class = classes.length == 1 ? classes[0] : declare(classes);

				return new Class(params, srcNodeRef);
			})).then(this.resolve, lang.hitch(this, "_handleErr"));
		},
		_cancelar : function() {
			this._destroyed = true;
		},
		placeAt : function(/* String|DomNode|_Widget */reference, /* String|Int? */position) {
			this.then(function(w) {
				if (w == null) {
					console.warn("Calling 'placeAt' on already destroyed widget");
					return;
				}
				return w.placeAt(reference, position);
			});
			return this;
		},
		on : function(/*String|Function*/type, /*Function*/func) {
			this.then(function(w) {
				if (w == null) {
					console.warn("Calling 'placeAt' on already destroyed widget");
					return;
				}
				return w.on(type, func);
			});
			return this;
		},
		startup : function() {
			this.then(function(w) {
				if (w == null) {
					console.warn("Calling 'startup' on already destroyed widget");
					return;
				}
				return w.startup();
			});
			return this;
		},
		set : function(name, value) {
			this.then(function(w) {
				if (w == null) {
					console.warn("Calling 'set' on already destroyed widget");
					return;
				}
				return w.set(name, value);
			});
			return this;
		},
		destroyRecursive : function(/*Boolean?*/preserveDom) {
			if (this.isResolved()) {
				return this.then(function(w) {
					return w.destroyRecursive(preserveDom);
				});
			} else {
				this.cancel(new Error("Widget was destroyed"));
			}
		},
		_handleErr : function(err) {
			if (this.customErrorHandling) {
				this.reject(err);
			}
			error.errbackDialogFatal(err);
		}
	});
});