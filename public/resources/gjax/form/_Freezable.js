define([
	"dojo/_base/declare", 
	"gjax/XString"
], function(declare, stringUtils) {

	return declare(null, {

		_frozen : null,
		_freezeState : null,
		
		freeze : function(prop, value, state) {
			// summary:
			//		Remember state of `prop` property and set it to `value`.
			//		Also propagates to child widgets.
			//
			//		A `state` value can be used to freeze the property in several independent states.
			// prop: String
			//		Property to freeze.
			// value: Any?
			//		Value, that property will be set to, default is `true`
			// state: String?
			//		Optional name of freeze state (must be used to unfreeze again).
			
			if (this._destroyed) {
				return;
			}
			
			if (typeof prop === "object") {
				state = value; // shift
				for ( var p in prop) {
					if (prop.hasOwnProperty(p)) {
						this.freeze(p, prop[p], state);
					}
				}
				return;
			}
			
			return this._freeze(true, prop, value, state);
		},

		unfreeze : function(prop, state) {
			// summary:
			//		Restore frozen state of `prop` property.
			//		Also propagates to child widgets.
			//
			//		If a property was frozen using `state`, it can be unfrozen only using the same state.
			// prop: String?
			//		Property to unfreeze. If null, unfreezes all props (in specified state)
			// state: String?
			//		Optional name of freeze state.

			if (this._destroyed) {
				return;
			}
			
			if (prop == null) {
				// unfreeze all frozen props (in specified state)
				for ( var p in this._freezeState) {
					if (!state || stringUtils.endsWith(p, "_" + state)) {
						this.unfreeze(p.replace(/_.*/, ""), state);						
					}
				}
				return;
			}
			return this._freeze(false, prop, null, state);
		},

		_freeze : function(on, prop, value, state) {
			// tags:
			//		private
			
			/*jshint expr:true */
			var fprop = state ? prop + "_" + state : prop;
			
			if ((this._frozen || {})[fprop] == on) {
				return false; // prop already frozen/unfrozen (in this state)				
			}

			this._freezeState || (this._freezeState = {});

			if (on) {
				this._freezeChildren(true, prop, value, state); // freeze chidren before freezing this widget
				value !== undefined || (value = true);
				// save original value (new value is in 'value')
				this._freezeState[fprop] = (prop in this.constructor.prototype ? this.get(prop) : undefined);
			}

			var origValue = this._freezeState[fprop];
			if (origValue !== undefined && (!on || value != origValue)) { // if property was present or was stored before
				this.set(prop, on ? value : origValue);
			}

			if (!on) {
				delete this._freezeState[fprop];
				this._freezeChildren(false, prop, null, state); // unfreeze chidren only after unfreezing this widget
			}

			(this._frozen || (this._frozen = {}))[fprop] = on;
			return true;
		},
		
		_freezeDomNode : function(domNode, on, prop, value, state) {
			// summary:
			//		Utility for rare cases when non-widget needs to be frozen.
			// tags:
			//		private
			
			/*jshint expr:true */
			var domName = (domNode.localName + "_" + (domNode.id || domNode.name || domNode.className || domNode.localName)).replace(/[^a-z0-9_]/gi, "_");
			var fprop = domName + "_" + (state ? prop + "_" + state : prop);
			
			if ((this._frozen || {})[fprop] == on) {
				return false; // prop already frozen/unfrozen (in this state)				
			}
			
			this._freezeState || (this._freezeState = {});
			
			if (on) {
				value || (value = true);
				// save original value (new value is in 'value')
				this._freezeState[fprop] = domNode[prop];
			}
			
			var origValue = this._freezeState[fprop];
			if (origValue !== undefined && (!on || value != origValue)) { // if property was present or was stored before
				domNode[prop] = on ? value : origValue;
			}
			
			if (!on) {
				delete this._freezeState[fprop];
			}
			
			(this._frozen || (this._frozen = {}))[fprop] = on;
			return true;
		},
		
		_freezeChildren : function(/*on, prop, value, state*/) {
			// summary:
			//		Internal method for freezing/unfreezing children (if available).
			// tags:
			//		protected extension
			return false;
		}
	});
});