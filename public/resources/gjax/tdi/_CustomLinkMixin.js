/**
 * widget			Link
 * created			05/17/2012
 * @author	 		jukrop
 * @description		
 */

define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/event",
	"dojo/_base/lang",
	"gjax/tdi",
	"dojo/aspect"
], function(declare, array, event, lang, tdi, aspect) {

	// module:
	//		gjax/tdi/_DialogLinkMixin
	// summary:
	//		Enables custom options for TDI widgets.
	return declare(null, {
		// summary:
		//		Enables custom options for TDI widgets.
		// description:
		//		Use `customOptions` property to configure custom options
		// example:
		//	|	customLink.set("customOptions", {
		//	|		dialog : {								// here "dialog" is option key
		//	|			label : "Open info dialog",
		//	|			opener : function(w) {				// opener function will recieve tdi widget as first parameter
		//	|				var href = w.get("href");
		//	|				dialog.info("Dialog", "Href is <strong>" + href + "</strong> but this custom opener opens this dialog instead.");
		//	|			}
		//	|		},
		//	|		console : {
		//	|			label : "Log to console",
		//	|			opener : function(w) {
		//	|				var href = w.get("href");
		//	|				console.log("Href is \"" + href + "\" but this custom opener logs to console instead.");
		//	|			}
		//	|		}
		//	|	});
		//		Don't forget to enable custom options using their option keys:
		//	|	customLink.set("enabledOptions", ["dialog", "console", "newWin"]);
		
		_customOptionKeys : null,

		customOptions : null,

		_dropDownCloseHandle : null,

		_setCustomOptionsAttr : function(customOpts) {
			this._customOptionKeys = [];
			this.customOptions = {};
			if (customOpts && lang.isObject(customOpts)) {
				for ( var optKey in customOpts) {
					if (typeof customOpts[optKey].opener == "function") {
						this._customOptionKeys.push(optKey);
						this.customOptions[optKey] = lang.mixin({}, customOpts[optKey]);
					} else {
						console.warn("Wrong custom option, opener function not present", customOpts[optKey]);
					}
				}
			}
			this.onMenuModified();
		},

		open : function(option, e) {
			/*jshint expr:true */
			e && event.stop(e);
			if (this.disabled) {
				return false;
			}

			if (this._customOptionKeys && ~array.indexOf(this._customOptionKeys, option)) {
				this.customOptions[option].opener(this, e);
			} else {
				return this.inherited(arguments);
			}
		},

		_updateTdiMenu : function() {
			this.inherited(arguments);

			this._rebuildCustomMenu();
		},

		_rebuildCustomMenu : function() {
			this._removeCustomMenu();
			this._buildCustomMenu();
		},

		_removeCustomMenu : function() {
			if (!this.dropDown) {
				return; // menu not built yet
			}
			// remove all custom options
			var menuItems = this.dropDown.getChildren();
			for ( var i = tdi.optionKeys.length; i < menuItems.length; i++) { // NTH: don't rely on custom options being AFTER tdi options
				this.dropDown.removeChild(menuItems[i]);
				menuItems[i].destroy();
			}
		},

		_buildCustomMenu : function() {
			if (!this.dropDown) {
				return; // menu not built yet
			}
			// add custom options
			if (this._customOptionKeys) {
				var enabledOptions = this.get("enabledOptions");
				for ( var j = 0; j < this._customOptionKeys.length; j++) {
					var optionKey = this._customOptionKeys[j];
					var item = this._addMenuItem(this.customOptions[optionKey].label);
					
					var disabled = !~array.indexOf(enabledOptions, optionKey);
					this._updateMenuItem(item, optionKey, disabled);
				}
			}
		},

		_buildTdiMenu : function() {
			this.inherited(arguments);

			if (this.closeDropDown) {
				this._dropDownCloseHandle = aspect.after(this, "closeDropDown", lang.hitch(this, this._removeCustomMenu));
			} else {
				// NTH make more effective
				this._dropDownCloseHandle = aspect.after(this.dropDown, "_openMyself", lang.hitch(this, function(args) {
					if (args.target == this.domNode) {
						var h = aspect.after(this.dropDown, "_onBlur", lang.hitch(this, function() {
							this._removeCustomMenu();
							h.remove();
						}));
					}
				}), true);
			}
		},

		destroy : function() {
			/*jshint expr:true */
			this._dropDownCloseHandle && this._dropDownCloseHandle.remove();
			this.inherited(arguments);
		}

	});
});