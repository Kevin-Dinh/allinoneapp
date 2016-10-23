define([
	"dojo/_base/lang",
	"dojo/on",
	"dojo/_base/declare",
	"dgrid/List",
	"dgrid/extensions/DijitRegistry",
	"gjax/form/_Freezable",
	"dojo/aspect",
	"dojo/_base/array",
	"dojo/query",
	"dojo/dom-class",
	"dojo/has",
	"gjax/log/level"
], function(lang, on, declare, List, DijitRegistry, _Freezable, aspect, array, query, domClass, has, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: added support own() function in dgrid");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: added support for 'hidden' and 'invisible' properties in dgrid");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: dgrid.on will automatically own the event (same as widgets)");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: _Freezable mixed to dgrid added");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: dgrid.onPausable, dgrid.onOnce added");

	// own extracted from dijit/Destroyable

	lang.extend(DijitRegistry, lang.mixin({}, _Freezable.prototype, {

		disabled : false,

		_setDisabled : function(disabled) {
			this._set("disabled", disabled);
			domClass.toggle(this.domNode, "gjaxDisabled", disabled);
		},
		
		on : function() {
			var signal = List.prototype.on.apply(this, arguments);
			return this.own(signal)[0];
		},
		
		onPausable : buildOnFunct("pausable"),
		
		onOnce : buildOnFunct("once"),

		own : function() {
			// summary:
			//		Track specified handles and remove/destroy them when this instance is destroyed, unless they were
			//		already removed/destroyed manually.
			// tags:
			//		protected
			// returns:
			//		The array of specified handles, so you can do for example:
			//	|		var handle = this.own(on(...))[0];

			array.forEach(arguments, function(handle) {
				var destroyMethodName = "destroyRecursive" in handle ? "destroyRecursive" : // remove "destroyRecursive" for 2.0
				"destroy" in handle ? "destroy" : "remove";

				// When this.destroy() is called, destroy handle.  Since I'm using aspect.before(),
				// the handle will be destroyed before a subclass's destroy() method starts running, before it calls
				// this.inherited() or even if it doesn't call this.inherited() at all. If that's an issue, make an
				// onDestroy() method and connect to that instead.
				var odh = aspect.before(this, "destroy", function(preserveDom) {
					handle[destroyMethodName](preserveDom);
				});

				// If handle is destroyed manually before this.destroy() is called, remove the listener set directly above.
				var hdh = aspect.after(handle, destroyMethodName, function() {
					odh.remove();
					hdh.remove();
				}, true);
			}, this);

			return arguments; // handle (array!)
		},
		
		// hidden: Boolean
		//		If widget is hidden.
		hidden : false,
		
		show : function() {
			// summary:
			//		Shows this grid.

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

		_setHidden : function(hidden) {
			if (hidden) {
				this.hide();
			} else {
				this.show();
			}
		},

		// invisible: Boolean
		//		If grid is invisible, that means: not visible but present, it takes all original space in markup
		invisible : false,

		_setInvisible : function(invisible) {
			this._set("invisible", invisible);
			domClass.toggle(this.domNode, "gjaxInvisible", invisible);
		},

		_freezeChildren : function(on, prop, value, state) {
			if (this.paginationNode) {
				// freeze pagination page-seze selector
				var pageSelect = (query("select.dgrid-page-size", this.paginationNode) || [])[0];
				if (pageSelect) {
					this._freezeDomNode(pageSelect, on, prop, value, state);
				}
				// freeze pagination page-textbox selector
				var pageTextBox = (query("input.dgrid-page-input", this.paginationNode) || [])[0];
				if (pageTextBox) {
					this._freezeDomNode(pageTextBox, on, prop, value, state);
				}
			}
		}

	}));
	
	function buildOnFunct(method) {
		return function(eventType, listener) {
			// see dgrid/List#on
			var signal = on[method](this.domNode, eventType, listener);
			if(!has("dom-addeventlistener")){
				this._listeners.push(signal);
			}
			return this.own(signal)[0];
		};
	}

});