/*jshint expr:true */
define([
	"dijit/_WidgetBase",
	"dojo/aspect",
	"dojo/has",
	"dojo/_base/lang",
	"dojo/_base/config",
	"gjax/mvc/converters",
	"gjax/mvc/EnhancedStateful",
	"gjax/mvc/EnhancedStatefulArray",
	"dojox/mvc/_atBindingMixin",
	"dojo/Stateful",
	"dijit/registry",
	"dojo/json",
	"dojox/mvc/StatefulArray",
	"dojox/mvc/sync",
	"gjax/error"
], function(_WidgetBase, aspect, has, lang, config, converters, EnhancedStateful, EnhancedStatefulArray, _atBindingMixin, Stateful, registry, json,
		StatefulArray, sync, error) {

	var resolvedEnumSuffix = config.resolvedEnumSuffix || "Label"; // RK: set 'Label' as default value if resolvedEnumSuffix is NOT configured

	//must be aspect after, because atBindingExstension hooks to 'before', we cannot ensure that our code would be after it
	//add converter scope
	aspect.after(_WidgetBase.prototype, "postscript", function() {
		var refs = this._refs;
		if (refs) {
			for ( var ref in refs) {
				if (lang.isString(refs[ref].converter)) {
					refs[ref].converter = converters[refs[ref].converter];
				}
				if (refs[ref].converter) {
					aspect.around(refs[ref].converter, "format", error.tryCatchFunction);
					aspect.around(refs[ref].converter, "parse", error.tryCatchFunction);
				}
			}
		}
	});

	//Create nested stateful objects, when binding to hierarchical mvc model"
	function resolve(/*dojo/Stateful|String*/target, /*dojo/Stateful?*/parent) {
		// summary:
		//		Find a dojo/Stateful for the target.
		// description:
		//		If target is not a string, return target itself.
		//		If target is "widget:widgetid", returns the widget whose ID is widgetid.
		//		If target is "rel:object.path", or target is other string, returns an object under parent (if specified) or under global scope.
		// target: dojo/Stateful|String
		//		The data binding to resolve.
		// parent: dojo/Stateful?
		//		The parent data binding. Used when the data binding is defined inside repeat.

		//AR: if we do not have parent, return (undefined)
		//otherwise new behaviour of lang.getObject would result in returning Window from resolve()
		//parent is empty string for Form widgets (it has target attr) until the model is bound to it

		if (typeof target == "string") {
			var tokens = target.match(/^(expr|rel|widget):(.*)$/) || [];
			try {
				if (tokens[1] == "rel") {
					//AR: added 'parent &&' to prevent calling lang.getObject with empty scope
					// which would result into getting property from window (global), e.g. rel:name
					target = parent && lang.getObject(tokens[2] || "", false, parent);
					//extension
					if (parent && !target) {
						var ctx = parent;
						var parts = (tokens[2] || "").split(".");
						for (var i = 0; i < parts.length; i++) {
							if (!(parts[i] in ctx)) {
								//TODO handling of stateful arrays
								ctx[parts[i]] = new Stateful();
							}
							ctx = ctx[parts[i]];
						}
						target = ctx;
					}
					//extension end
				} else if (tokens[1] == "widget") {
					target = registry.byId(tokens[2]);
				} else {
					target = lang.getObject(tokens[2] || target, false, parent);
				}
			} catch (e) {
			}
		}
		if (target === window) {
			return; // undefined
		}

		return target; // dojo/Stateful
	}

	//copied from dojox/mvc/_atBindingMixin
	var getLogContent, logResolveFailure;
	if (has("mvc-bindings-log-api")) {
		getLogContent = function(/*dojo/Stateful*/target, /*String*/targetProp) {
			return [
				target._setIdAttr || !target.declaredClass ? target : target.declaredClass,
				targetProp
			].join(":");
		};

		logResolveFailure = function(target, targetProp) {
			console.warn(targetProp + " could not be resolved" + (typeof target == "string" ? (" with " + target) : "") + ".");
		};
	}
	function getParent(/*dijit/_WidgetBase*/w) {
		// summary:
		//		Returns parent widget having data binding target for relative data binding.
		// w: dijit/_WidgetBase
		//		The widget.

		// Usage of dijit/registry module is optional. Return null if it's not already loaded.
		var registry;
		try {
			registry = require("dijit/registry");
		} catch (e) {
			return;
		}
		var pn = w.domNode && w.domNode.parentNode, pw;
		while (pn) {
			pw = registry.getEnclosingWidget(pn);
			if (pw) {
				var relTargetProp = pw._relTargetProp || "target", pt = lang.isFunction(pw.get) ? pw.get(relTargetProp) : pw[relTargetProp];
				if (pt || relTargetProp in pw.constructor.prototype) {
					return pw; // dijit/_WidgetBase
				}
			}
			pn = pw && pw.domNode.parentNode;
		}
	}

	//inspired by dojox/mvc/_atBindingMixin
	function bind(/*dojo/Stateful|String*/source, /*String*/sourceProp, /*dijit/_WidgetBase*/target, /*String*/targetProp, /*dojox/mvc/sync.options*/
	options) {
		// summary:
		//		Resolves the data binding literal, and starts data binding.
		// source: dojo/Stateful|String
		//		Source data binding literal or dojo/Stateful to be synchronized.
		// sourceProp: String
		//		The property name in source to be synchronized.
		// target: dijit/_WidgetBase
		//		Target dojo/Stateful to be synchronized.
		// targetProp: String
		//		The property name in target to be synchronized.
		// options: dojox/mvc/sync.options
		//		Data binding options.

		var _handles = {}, parent = getParent(target), relTargetProp = parent && parent._relTargetProp || "target";

		/*jshint maxcomplexity:50 */
		function resolveAndBind() {
			_handles["Two"] && _handles["Two"].unwatch();
			delete _handles["Two"];

			var relTarget = parent && (lang.isFunction(parent.get) ? parent.get(relTargetProp) : parent[relTargetProp]), resolvedSource = resolve(source,
					relTarget), resolvedTarget = resolve(target, relTarget);

			if (has("mvc-bindings-log-api") && (!resolvedSource || /^rel:/.test(source) && !parent)) {
				logResolveFailure(source, sourceProp);
			}
			if (has("mvc-bindings-log-api") && (!resolvedTarget || /^rel:/.test(target) && !parent)) {
				logResolveFailure(target, targetProp);
			}
			if (!resolvedSource || !resolvedTarget || (/^rel:/.test(source) || /^rel:/.test(target)) && !parent) {
				return;
			}
			if ((!resolvedSource.set || !resolvedSource.watch) && sourceProp == "*") {
				if (has("mvc-bindings-log-api")) {
					logResolveFailure(source, sourceProp);
				}
				return;
			}

			//AR if binding to resolved enum, create _{id}Item property
			if (options.bindingToResolved) {
				if (!resolvedSource[sourceProp]) {
					var id = sourceProp.substring(1, sourceProp.length - 4); //_{id}Item
					var name = id.lastIndexOf("Id") + 2 == id.length ? id.substring(0, id.length - 2) : id; // remove "Id" suffix

					var hasCustomResolvedProp = typeof options.bindingToResolved == "string";
					var resolvedProp = hasCustomResolvedProp ? options.bindingToResolved : name + resolvedEnumSuffix;

					var resolvedItem = {
						id : resolvedSource[id],
						name : resolvedSource[resolvedProp]
					};
					if (hasCustomResolvedProp) {
						resolvedItem.resolvedProp = options.bindingToResolved;
					}
					resolvedSource[sourceProp] = json.stringify(resolvedItem);
				}
			}

			if (sourceProp == null) {
				// If source property is not specified, it means this handle is just for resolving data binding target.
				// (For dojox/mvc/Group and dojox/mvc/Repeat)
				// Do not perform data binding synchronization in such case.
				/*jshint expr:true */
				lang.isFunction(resolvedTarget.set) ? resolvedTarget.set(targetProp, resolvedSource) : (resolvedTarget[targetProp] = resolvedSource);
				if (has("mvc-bindings-log-api")) {
					console.log("dojox/mvc/_atBindingMixin set " + resolvedSource + " to: " + getLogContent(resolvedTarget, targetProp));
				}
			} else {
				// Start data binding
				//AR, LZ: added feature to ensure creating stateful for nested groups
				if (!(sourceProp in resolvedSource) && resolvedTarget.declaredClass == "dojox.mvc.Group") {/* git-qa */
					//TODO _isArray added temporarily, how to detect groups bound to arrays?
					if (resolvedSource.isInstanceOf(EnhancedStateful)) {
						//create instance of same class as resolvedSource and add as Child (EnhancedStateful devind in ModelRefController)
						resolvedSource.set(sourceProp, resolvedTarget._isArray ? new EnhancedStatefulArray() : new EnhancedStateful());
					} else {
						resolvedSource[sourceProp] = resolvedTarget._isArray ? new StatefulArray() : new Stateful();
					}
				}
				//-------------
				_handles["Two"] = sync(resolvedSource, sourceProp, resolvedTarget, targetProp, options); // dojox/mvc/sync.handle
			}

			//AR, JU: added feature to ensure clearing fields, no value is found in source
			//-------------
			/*jshint laxbreak:true*/
			if ((!resolvedSource || (lang.isFunction(resolvedSource.get) ? resolvedSource.get(sourceProp) : resolvedSource[sourceProp]) === undefined)
					&& resolvedTarget && resolvedTarget.reset) {
				resolvedTarget.reset();
			}
			//-------------
		}

		resolveAndBind();
		if (parent && /^rel:/.test(source) || /^rel:/.test(target) && lang.isFunction(parent.set) && lang.isFunction(parent.watch)) {
			_handles["rel"] = parent.watch(relTargetProp, function(name, old, current) {
				if (old !== current) {
					if (has("mvc-bindings-log-api")) {
						console.log("Change in relative data binding target: " + parent);
					}
					resolveAndBind();
				}
			});
		}
		var h = {};
		h.unwatch = h.remove = function() {
			for ( var s in _handles) {
				/*jshint expr:true */
				_handles[s] && _handles[s].unwatch();
				delete _handles[s];
			}
		};
		return h;
	}

	var mixin = {
		_startAtWatchHandles : function(/*dojo/Stateful*/bindWith) {
			// summary:
			//		Establish data bindings based on dojox/mvc/at handles.
			// bindWith: dojo/Stateful
			//		The dojo/Stateful to bind properties with.

			this.canConvertToLoggable = true;

			var refs = this._refs;
			if (refs) {
				var atWatchHandles = this._atWatchHandles = this._atWatchHandles || {};

				// Clear the cache of properties that data binding is established with
				this._excludes = null;

				// First, establish non-wildcard data bindings
				for ( var prop in refs) {
					if (!refs[prop] || prop == "*") {
						continue;
					}
					var bindingToResolved = refs[prop].bindingToResolved;
					atWatchHandles[prop] = bind(refs[prop].target, refs[prop].targetProp, bindWith || this, prop, {
						bindDirection : refs[prop].bindDirection,
						converter : refs[prop].converter,
						equals : refs[prop].equalsCallback,
						//AR:add flag about binding to resolved enum
						bindingToResolved : bindingToResolved
					});
					if (typeof bindingToResolved == "string") {
						this.set("resolvedProp", bindingToResolved);
					}
				}

				// Then establish wildcard data bindings
				if ((refs["*"] || {}).atsignature == "dojox.mvc.at") {/* git-qa */
					atWatchHandles["*"] = bind(refs["*"].target, refs["*"].targetProp, bindWith || this, "*", {
						bindDirection : refs["*"].bindDirection,
						converter : refs["*"].converter,
						equals : refs["*"].equalsCallback
					});
				}
			}
		},

		_setAtWatchHandle : function(/*String*/name, /*Anything*/value) {
			// summary:
			//		Called if the value is a dojox/mvc/at handle.
			//		If this widget has started, start data binding with the new dojox/mvc/at handle.
			//		Otherwise, queue it up to this._refs so that _dbstartup() can pick it up.

			if (name == "ref") {
				throw new Error(this + ": 1.7 ref syntax used in conjuction with 1.8 dojox/mvc/at syntax, which is not supported.");
			}

			// Claen up older data binding
			var atWatchHandles = this._atWatchHandles = this._atWatchHandles || {};
			if (atWatchHandles[name]) {
				atWatchHandles[name].unwatch();
				delete atWatchHandles[name];
			}

			// Claar the value
			this[name] = null;

			// Clear the cache of properties that data binding is established with
			this._excludes = null;

			if (typeof value.bindingToResolved == "string") {
				this.set("resolvedProp", value.bindingToResolved);
			}

			if (this._started) {
				// If this widget has been started already, establish data binding immediately.
				atWatchHandles[name] = bind(value.target, value.targetProp, this, name, {
					bindDirection : value.bindDirection,
					converter : value.converter,
					equals : value.equalsCallback,
					bindingToResolved : value.bindingToResolved
				});
				//JU: save it to _refs anyway (for future use);
				this._refs[name] = value;
			} else {
				// Otherwise, queue it up to this._refs so that _dbstartup() can pick it up.
				this._refs[name] = value;
			}
		}
	};

	lang.mixin(_atBindingMixin.mixin, mixin);// override also plain object version which is used by atBindingExtension
	_atBindingMixin.extend(mixin);
	return _atBindingMixin;

});
