/**
 * @author arakovsky + others Extends _WidgetBase
 */
define([
	"dijit/_WidgetBase",
	"gjax/form/_Freezable",
	"dojo/dom-attr",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/sniff",
	"dojo/_base/lang",
	"gjax/log/level",
	"dojo/aspect", 
	"dojo/on"
], function(_WidgetBase, _Freezable, domAttr, domStyle, domClass, has, lang, level, aspect, on) {
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _WidgetBase - show()/hide()/hidden and added");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _WidgetBase - invisible added");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _WidgetBase - isDestroyed added");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _WidgetBase - own watch called on widget");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _WidgetBase - _Freezable mixed in");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: _WidgetBase - own widgets from template (otherwise e.g. dialogs are not destroyed)");

	_WidgetBase.extend(lang.mixin({}, _Freezable.prototype, {
		isDestroyed : function() {
			// summary:
			//		Conveniet method to find out if a widget is destroyed
			return this._destroyed;
		},

		postCreate : function() {
			// summary:
			//		own widgets from template (otherwise e.g. dialogs are not destroyed)
			this.inherited(arguments);
			if (this._startupWidgets) {
				this.own.apply(this, this._startupWidgets);
			}
		},

		show : function() {
			// summary:
			//		Shows this widget together with its label.

			domClass.remove(this.domNode, "gjaxHidden");
			if (this.resize) {
				this.resize();
			}
			this._set("hidden", false);
		},
		hide : function() {
			// summary:
			//		Hides this widget together with its label.

			domClass.add(this.domNode, "gjaxHidden");

			this._set("hidden", true);
		},
		// hidden: Boolean
		//		If widget is hidden.
		hidden : false,

		_setHiddenAttr : function(hidden) {
			if (hidden) {
				this.hide();
			} else {
				this.show();
			}
		},

		// invisible: Boolean
		//		If widget is invisible, that means: not visible but present it takes all original space in markup
		invisible : false,
		_setInvisibleAttr : function(invisible) {
			this._set("invisible", invisible);
			domClass.toggle(this.domNode, "gjaxInvisible", invisible);
		},

		_setDisabledAttr : function(disabled) {
			this._set("disabled", disabled);

			// PM: remove disabled attr from domNode, in IE9< it causes gray text and text shadow that cannot be changed (ie9 feature)
			// 
			disabled && has("ie") <= 9 && domAttr.remove(this.domNode, "disabled");
		},

		watch : function() {
			return this.own(this.inherited(arguments))[0];
		},

		onPausable : function(/*String|Function*/type, /*Function*/func) {
			var paused;
			var signal = this.on(type, function() {
				if (!paused) {
					return func.apply(this, arguments);
				}
			});
			signal.pause = function() {
				paused = true;
			};
			signal.resume = function() {
				paused = false;
			};
			return signal;
		},

		onOnce : function(/*String|Function*/type, /*Function*/func) {
			// summary:
			//		This function acts the same as on(), but will only call the listener once. The 
			//		listener will be called for the first
			//		event that takes place and then listener will automatically be removed.
			var signal = this.on(type, function() {
				// remove this listener
				signal.remove();
				// proceed to call the listener
				return func.apply(this, arguments);
			});
			return signal;
		},

		on : function(/*String|Function*/type, /*Function*/func) {
			// summary:
			//		Call specified function when event occurs, ex: myWidget.on("click", function(){ ... }).
			// type:
			//		Name of event (ex: "click") or extension event like touch.press.
			// description:
			//		Call specified function when event `type` occurs, ex: `myWidget.on("click", function(){ ... })`.
			//		Note that the function is not run in any particular scope, so if (for example) you want it to run in the
			//		widget's scope you must do `myWidget.on("click", lang.hitch(myWidget, func))`.

			// For backwards compatibility, if there's an onType() method in the widget then connect to that.
			// Remove in 2.0.
			var widgetMethod = this._onMap(type);
			if (widgetMethod) {
				//MR: track the handle and remove it when this instance is destroyed
				return this.own(aspect.after(this, widgetMethod, func, true))[0];
			}
			// Otherwise, just listen for the event on this.domNode.
			return this.own(on(this.domNode, type, func))[0];
		}
	}));

});