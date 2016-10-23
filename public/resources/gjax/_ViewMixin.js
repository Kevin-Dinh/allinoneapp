define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/topic",
	"dojo/Deferred",
	"dojo/on",
	//"gjax/async/widget",
	"gjax/_IdsInTemplateMixin", //prefix all generated id attributes
	"gjax/error",
	"gjax/_base/object",
	"gjax/_base/date",
	"dojo/_base/array",
	"dojo/i18n!./nls/_ViewMixin",
	"dojox/lang/functional",
	"dojo/dom-attr",
	"./widget/utils",
	//
	"dojox/lang/functional/fold"
], function(declare, lang, topic, Deferred, on, /*asyncWidget,*/_IdsInTemplateMixin, error, gobject, gdate, array, i18n, df, domAttr, widgetUtils) {

	//Mixin that extracts common logic from TemplatedDialog and View
	var ViewMixin = declare(_IdsInTemplateMixin, {

		_charts : null,

		requiredGroupCounter : null,

		constructor : function() {
			this._charts = [];
			this.requiredGroupCounter = 0;
		},

		ensureRequirement : widgetUtils.ensureRequirement,
		ensureDateInterval : widgetUtils.ensureDateInterval,
		ensureTimeInterval : widgetUtils.ensureTimeInterval,
		ensureDateTimeInterval : widgetUtils.ensureDateTimeInterval,
		ensureNumberInterval : widgetUtils.ensureNumberInterval,

		bindEvent : function(attachPoint, event, handler) {
			// summary:
			//		convinient method for binding to events of attachPoint to method of this view/dialog (with implicit scope 'this')
			// attachPoint: String 
			//		Name of attachPoint of element/widget that is originator of event.
			// event: String 
			//		Name of event.
			// handler: String?
			//		Name of a function in this view to use as handler.
			//		Is not provided, handler name will be generated as  h{AttachPoint}{Event}.
			// returns: Object
			//		An object with a remove() method that can be used to stop listening for this event.
			// example:
			//	|	this.bindEvent("saveBtn", "click"); // expects this.hSaveBtnClick to be a function
			//	|
			// example:
			//	The returned listener object can be used to stop listening for this event.
			//
			//	|	var listener = this.bindEvent("saveBtn", "click");
			//	|	listener.remove(); // this will stop listening for this event
			if (!(attachPoint in this)) {
				throw error.newError(new Error(), "Attach point '" + attachPoint + "' not found.", null, "gjax/_ViewMixin", "IllegalArgumentException");
			}

			handler = handler ? handler : "h" + capFirstLetters([
				attachPoint,
				event
			]);

			if (!(handler in this) || typeof this[handler] != "function") {
				throw error.newError(new Error(), "Handler '" + handler + "' not found.", null, "gjax/_ViewMixin", "IllegalArgumentException");
			}

			//we need to use apply, to pass other arguments to lang.hitch
			var handle = on(this[attachPoint], event, lang.hitch.apply(lang, [
				this,
				handler
			].concat(Array.prototype.slice.call(arguments, 3))));

			this.own(handle);
			return handle;
		},

		bindTopic : function(topicName, handler) {
			// summary:
			//		Hooks `handler` to given `topicName`. 
			//
			//		Any extra attributes will be sent to handler function.
			// topicName: String 
			//		Name of topic.
			// handler: String?
			//		Name of a function in this view to use as handler.
			//		Is not provided, handler name will be generated as h{topicName}.
			// example:
			//	|	this.bindTopic("save-success"); // expects this.hSaveSuccess to be a function
			handler = handler ? handler : "h" + capFirstLetters(topicName);

			if (!(handler in this) || typeof this[handler] != "function") {
				throw error.newError(new Error(), "Handler '" + handler + "' not found.", null, "gjax/_ViewMixin", "IllegalArgumentException");
			}

			//we need to use apply, to pass other arguments to lang.hitch
			var handle = topic.subscribe(topicName, lang.hitch.apply(lang, [
				this,
				handler
			].concat(Array.prototype.slice.call(arguments, 2))));
			this.own(handle);
			return handle;
		},

		openDialog : function(propertyName, mid, _require, params) {
			// summary:
			//		Loads and opens dialog
			// description:
			//		Method checks if dialog instance already exists under given property
			//		If not (or if the dialog is destroyed) lazy loads the Dialog class (according give mid) and constrcuts it with given parameters
			//		If the dialog exists, it sets given params to it and open it
			// propertyName: String
			//		property to which will be the instance assigned
			// mid: String
			//		mid of module with constructor to load
			// _require: Function?
			//		context sensitive require, if specified allows MID to be relative
			// params: Object
			//		 params for the constructor (if reopen existing one, set method will be called on the widget with this obj as input)

			var req = _require || require;
			var dialogParams = params;

			//_require function is optional, shift params if it is not defined
			if (!lang.isFunction(req)) {
				dialogParams = _require;
				req = require;
			}

			// if dialog is already created and not destroyed, just call set with given params
			if (!this[propertyName] || this[propertyName].isDestroyed()) {
				var dfd = new Deferred();
				dfd.showDeferred = new Deferred();

				var blockReferenceObj = {};
				topic.publish("block-operation", blockReferenceObj);
				req([
					mid
				], lang.hitch(this, function(DialogClass) {
					topic.publish("unblock-operation", blockReferenceObj);
					var dialog = this[propertyName] = new DialogClass(dialogParams);
					dialog.startup();
					var closeDfd = dialog.show();
					closeDfd.showDeferred.then(dfd.showDeferred.resolve, dfd.showDeferred.reject);
					closeDfd.then(dfd.resolve, dfd.reject);
				}));
				return dfd;
			} else {
				var dialog = this[propertyName];
				dialog.set(dialogParams || {});
				return dialog.show();
			}
		},

		withWidgets : function(targetWidgets /*=====, method, args =====*/) {
			// summary:
			//		Convenience helper to execute method on more widgets.
			// targetWidgets: dijit/_Widget[]|dijit/_Widget|String[]|String
			//		Array of widgets or single widget or array of attachPoint names or string with attachPoints separated by comma
			// method: String | Function
			//		Method name.
			// args: Any...
			//		Any arguments that should be send to `method` call.
			// returns: Array[]
			//		Array of return values. When `method` does not return anything, array of undefined values is returned.
			//		Length of returned array always matches length of `targetWidgets` array.
			// example:
			//	|	this.withWidgets([this.goBtn, this.runBtn], "set", "disabled", true);
			//	|	this.withWidgets(["goBtn", "runBtn"], "get", "value");
			//	|	this.withWidgets("goBtn,runBtn", "hide");
			//		can even access subwidget:
			//	|	this.withWidgets("searchView.goBtn,searchView.runBtn", "hide");

			// normalize
			targetWidgets = this._toWidgetArray(targetWidgets);

			return gobject.call.apply(gobject, arguments);
		},

		_toWidgetArray : function(targetWidgets) {
			if (targetWidgets == null) {
				return [];
			}
			targetWidgets = lang.isString(targetWidgets) ? targetWidgets.split(/\s*,\s*/) : lang.isArray(targetWidgets) ? targetWidgets : [
				targetWidgets
			];
			return array.map(targetWidgets, function(w) {
				if (typeof w == "string") {
					var widget = w ? lang.getObject(w, false, this) : null;
					widget || console.warn("_ViewMixin.withWidgets: Attach point '" + w + "' not found.");
					return widget;
				}
				return w;
			}, this);
		},

		requiredGroupMark : null,

		requiredGroup : function(targetWidgets, message) {
			// summary:
			//		Setup validation on given widget, that checks if at least one of them in not empty
			// returns: Object
			//		Contains a function "remove" which allows to cancel given required group and revert affected widgets into its original state.

			targetWidgets = this._toWidgetArray(targetWidgets);

			message || (message = i18n.msgRequiredGroup);

			var idx = ++this.requiredGroupCounter;
			var h = {
				_refs : [],
				remove : function() {
					array.forEach(this._refs, function(ref) {
						//set widget into its original state
						if (!ref.w._destroyed) {
							ref.w.set({
								required : ref.required,
								promptMessage : ref.promptMessage,
								missingMessage : ref.missingMessage
							});
							domAttr.set(ref.w.domNode, "data-required-mark", ref.requiredMark);
						}

						//cancel handlers
						array.forEach(ref.handlers, "item.remove()");
					}, this);
					this._refs = [];
				}
			};

			for (var i = 0, l = targetWidgets.length; i < l; i++) {
				var w = targetWidgets[i];
				//remember original state
				h._refs[i] = {
					w : w,
					required : w.required,
					promptMessage : w.promptMessage,
					missingMessage : w.missingMessage,
					requiredMark : domAttr.get(w.domNode, "data-required-mark")
				};

				domAttr.set(w.domNode, "data-required-mark", this.requiredGroupMark || idx);
				w.buildTitleFromLabel = lang.partial(buildTitleFromLabel, message);
				w.set({
					required : true,
					promptMessage : message,
					missingMessage : message
				});

				h._refs[i].handlers = [
					w.watch("value", lang.partial(updateRequiredStatus, targetWidgets)),//
					//watch also property, which is set only to be watched by this function, because value could not be set 
					w.watch("valueChangeFlag", lang.partial(updateRequiredStatus, targetWidgets)),//
					w.watch("disabled", lang.partial(updateRequiredStatus, targetWidgets))
				];
			}
			//update status, because some values may be already filled in
			updateRequiredStatus(targetWidgets);

			this.own(h);
			return h;
		},

		registerChart : function(chart) {
			// summary:
			//		Registers given chart to be handled by this view/dialog. 
			// description:
			//		Correctly handles resizing and destroying of the chart with resizing/destroying of this widget
			// chart: AmChart
			//		Chart to register
			this._charts.push(chart);
			this.own(chart); //AmChart has destroy method, so we can use this.own
		},

		resize : function() {
			this.inherited(arguments);
			if (this._charts) {
				df.forEach(this._charts, "a.handleResize()");
			}
		}
	});

	function capFirstLetters(str) {
		var parts = lang.isArray(str) ? str : str.split(/[\s\-_]+/);
		parts = array.map(parts, function(s) {
			return s.substr(0, 1).toUpperCase() + s.substr(1);
		});
		return parts.join("");
	}

	function buildTitleFromLabel(message, label) {
		if (!this.required) {
			return label;
		}
		return label.length ? label + " (" + message + ")" : message;
	}

	function updateRequiredStatus(widgets) {
		var allEmpty = array.every(widgets, function(w) {
			return isEmpty(w.get("value")) && !w.get("disabled");
		});
		array.forEach(widgets, function(w) {
			if (allEmpty || isEmpty(w.get("value"))) {
				// dont set required to false on widgets that have data
				w.set("required", allEmpty);
			}
			if (!w.required) {
				// only to remove validation errors (avoid display of validation messages on all fields when erasing value) 
				w.validate();
			}
		});
	}

	function isEmpty(value) {
		return gobject.isEmptyValue(value) || (lang.isObject(value) && !gdate.isDate(value) && gobject.isEmpty(gobject.filter(value)));
	}

	return ViewMixin;
});
