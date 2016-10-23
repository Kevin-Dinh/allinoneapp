define([
	"dijit/_HasDropDown",
	"dojo/_base/lang", // lang.hitch lang.isFunction
	"dojo/on",
	"dojo/touch",
	"dojo/keys", // keys.DOWN_ARROW keys.ENTER keys.ESCAPE
	"gjax/log/level"
], function(_HasDropDown, lang, on, touch, keys, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Widgets can open dropdown on domNode click (not only via arrow)");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Widgets will not open dorpdown on arrow when key modifier is also present");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: If autoWidth is true and dropDown's size is adapted, allow dropDown to expand when longer items are set.");

	var origBuildRendering = _HasDropDown.prototype.buildRendering;

	_HasDropDown.extend({

		// openOnDomNodeClick: [protected] Boolean
		//		If true, clicking anywhere on widget opens dropdown (not only on _buttonNode)
		openOnDomNodeClick : false,

		_onDropDownMouseDown: function(/*Event*/ e){
			// summary:
			//		Callback when the user mousedown/touchstart on the arrow icon.

			if(this.disabled || this.readOnly){
				return;
			}

			// JU: don't stop event when openOnDomNodeClick - it would prevent text selection
			if(e.type != "MSPointerDown" && e.type != "pointerdown" && !this.openOnDomNodeClick){
				e.preventDefault();
			}

			this.own(on.once(this.ownerDocument, touch.release, lang.hitch(this, "_onDropDownMouseUp")));

			this.toggleDropDown();
		},

		buildRendering: function(){
			origBuildRendering.apply(this, arguments);

			if (this.openOnDomNodeClick) {
				this._stopClickEvents = false;
				this._origButtonNode = this._buttonNode;
				// JU: inspired by dijit/form/_DateTimeTextBox.js
				this._buttonNode = this.domNode;
				this.baseClass += " dijitComboBoxOpenOnClick";
			}
		},

		_onKey: function(/*Event*/ e){
			// summary:
			//		Callback when the user presses a key while focused on the button node

			if(this.disabled || this.readOnly){
				return;
			}
			var d = this.dropDown, target = e.target;
			if(d && this._opened && d.handleKey){
				if(d.handleKey(e) === false){
					/* false return code means that the drop down handled the key */
					e.stopPropagation();
					e.preventDefault();
					return;
				}
			}
			if(d && this._opened && e.keyCode == keys.ESCAPE){
				this.closeDropDown();
				e.stopPropagation();
				e.preventDefault();
			}else if(!this._opened &&
				(e.keyCode == keys.DOWN_ARROW && !(e.ctrlKey || e.altKey || e.metaKey) || // JU: ignore modified DOWN_ARROW
					// ignore unmodified SPACE if _KeyNavMixin has active searching in progress
					( (e.keyCode == keys.ENTER || (e.keyCode == keys.SPACE && (!this._searchTimer || (e.ctrlKey || e.altKey || e.metaKey)))) &&
						//ignore enter and space if the event is for a text input
						((target.tagName || "").toLowerCase() !== 'input' ||
							(target.type && target.type.toLowerCase() !== 'text'))))){
				// Toggle the drop down, but wait until keyup so that the drop down doesn't
				// get a stray keyup event, or in the case of key-repeat (because user held
				// down key for too long), stray keydown events
				this._toggleOnKeyUp = true;
				e.stopPropagation();
				e.preventDefault();
			}
		}

	});
});
