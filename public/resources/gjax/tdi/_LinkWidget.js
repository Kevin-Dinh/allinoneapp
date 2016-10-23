/**
 * widget			Link
 * created			05/17/2012
 * @author	 		jukrop
 * @description		
 */

define([
	"dojo/_base/declare",
	"dojo/i18n!./nls/_LinkWidget",
	"dojo/on",
	"dojo/mouse",
	"dojo/aspect",
	"dojo/_base/array",
	"dojo/_base/event",
	"dojo/_base/lang",
	"dojo/dom-class",
	"gjax/tdi",
	"gjax/uri/Uri",
	"dijit/MenuItem",
	"dijit/Menu",
	"gjax/error",
	"dojo/promise/all",
	"dojo/dom-attr", 
	"gjax/_base/kernel"
], function(declare, messages, on, mouse, aspect, array, event, lang, domClass, tdi, Uri, MenuItem, Menu, error, all, domAttr, gkernel) {

	var dropDown = null;
	var handlers = [];
	var instancesCount = 0;

	// module:
	//		gjax/tdi/_LinkWidget
	// summary:
	//		Base class for TDI widgets.
	
	return declare(null, {
		// summary:
		//		Base class for TDI widgets.
		// description:
		//		Widget used for navigation using TDI. When clicked, user is navigated to `uri` 
		//		using `defaultOption`.
		//		Widget also provides dropdown menu with other navigation options. 
		//		See gjax.tdi API for more informations on TDI options.
		//
		//		All properties used to open window can be set as promises.

		// label: String
		//		Content to display in button.
		label : null,

		// href: String|Function|Promise
		//		URI that is opened by this widget. If function si provided, 
		//		its return value us used as `href`.
		href : "",

		// defaultOption: String
		//		TDI option used when widget is clicked.
		defaultOption : null,

		// enabledOptions: String[]
		//		TDI options showed when dropdown menu is shown.
		enabledOptions : null,

		// closeWithParent: Boolean?
		//		Close target as soon as this window is closed.
		closeWithParent : null,
		
		// openInExisting: Boolean?
		//		Open target in existing tab/window if possible.
		openInExisting : null,

		// hideDisabled: Boolean
		//		Hides options not present in `enabledOptions` from dropdown menu.
		hideDisabled : true,

//		focusTarget : true,

		// vArguments: Object|Function|Promise
		//		Arguments to send to window opened by this widget. If function is provided, 
		//		its return value us used as `vArguments`.
		vArguments : null,

		// reopenArguments: Object|Function|Promise
		//		Arguments to use, if page opened by this widget (in thes same window) want to 
		//		reopen original opener page. 
		//		If function is provided, its return value us used as `reopenArguments`.
		reopenArguments : null,

		// callback: Function|Promise
		//		Callback to send to window opened by this widget.
		callback : null,

		// features: String|Object|Function|Promise
		//		Features to send to window opened by this widget, will be used only
		//		if "newWin" option is used.
		//		String cannot contain spaces.
		//		If function si provided, its return value us used as `features`.
		// example:
		//		as string:
		//	|	"width=800,height=600,resizable=yes"
		//		or as object
		//	|	{
		//	|		width : 800,
		//	|		heigth : 600,
		//	|		resizable : true
		//	|	}
		features : null,

		// dropDown: [protected] dijit/Menu
		//		The widget to display as a TDI menu.
		dropDown : null,

		_dropDownHandle : null,

		constructor : function() {
			this._menuItems = [];
			instancesCount++;
		},

		_setHrefAttr : function(/*String|Function*/href) {
			this.href = href;
			if (this.hrefNode) {
				domAttr.set(this.hrefNode, "href", typeof href == "string" ? href : "#");
			}
		},

		_getHrefAttr : function() {
			if (typeof this.href == "function") {
				return this.href();
			} else {
				return this.href;
			}
		},

		_setDefaultOptionAttr : function(/*String*/opt) {
			this.defaultOption = opt;
		},

		_getDefaultOptionAttr : function() {
			return this.defaultOption || tdi.defaultOption; // return String
		},

		_setCallbackAttr : function(/*Function*/callback) {
			this.callback = callback;
		},

		_getCallbackAttr : function() {
			return this.callback;
		},
		
		_setCloseWithParentAttr : function(/*Boolean*/closeWithParent) {
			this.closeWithParent = closeWithParent;
		},
		
		_getCloseWithParentAttr : function() {
			if (typeof this.closeWithParent == "function") {
				return this.closeWithParent(); // return Boolean
			} else {
				return this.closeWithParent; // return Boolean
			}
		},

		_setEnabledOptionsAttr : function(/*String|Array*/opts) {
			this.enabledOptions = tdi.parseFlags(opts);
			this.onMenuModified();
		},

		_getEnabledOptionsAttr : function() {
			return this.enabledOptions || tdi.defaultEnabledOptions; // return Array
		},

		_setHideDisabledAttr : function(/*Boolean*/hideDisabled) {
			this.hideDisabled = hideDisabled;
			this.onMenuModified();
		},

		_getOpenInExistingAttr : function() {
			return this.openInExisting != null ? this.openInExisting : tdi.defaultOpenInExisting;
		},

		_setVArgumentsAttr : function(/*Object|Function*/vArguments) {
			// NTH sanitize values & arrays? asrt + exception? or just expect proper data?
			this.vArguments = vArguments;
		},

		_getVArgumentsAttr : function() {
			if (typeof this.vArguments == "function") {
				return this.vArguments(); // return Object
			} else {
				return this.vArguments; // return Object
			}
		},

		_setReopenArgumentsAttr : function(/*Object|Function*/reopenArguments) {
			// NTH sanitize values & arrays? asrt + exception? or just expect proper data?
			this.reopenArguments = reopenArguments;
		},

		_getReopenArgumentsAttr : function() {
			if (typeof this.reopenArguments == "function") {
				return this.reopenArguments(); // return Object
			} else {
				return this.reopenArguments; // return Object
			}
		},

		_setFeaturesAttr : function(/*String*/features) {
			this.features = features;
		},

		_getFeaturesAttr : function() {
			var features = this.features || tdi.defaultNewWinFeatures;
			if (typeof features == "function") {
				features = features();
			}
			return features; // return Object|String
		},

		onMenuModified : function() {
			// summary:
			//		Called when menu options are modified.
			// tags:
			//		callback
		},

		_addTargetEvents : function(wndClosedPromise, option) {
			// summary:
			//		Binds "target-close" and "target-open" events to promises returned by tdi.open
			// tags:
			//		private
			wndClosedPromise.then(lang.hitch(this, function(args) {
				this.emit("target-close", {
					detail : {
						option : option,
						returnValue : args,
						window : wndClosedPromise.window
					}
				});
			}), error.errbackDialog); // most probable error is popup blocker

			wndClosedPromise.ready.then(lang.hitch(this, function() {
				this.emit("target-open", {
					detail : {
						option : option,
						window : wndClosedPromise.window
					}
				});
			}), error.callbackNoop); // ignore error, it is the same as handled above
		},

		open : function(option, e) {
			// summary:
			//		Navigate using provided option
			// option: String
			//		One of TDI options - "same", "new", "newWin".

			/*jshint expr:true */

			e && event.stop(e);
			if (this.disabled) {
				return false;
			}

			var attrsReady = {
				href : this.get("href"),
				vArgs : this.get("vArguments"),
				reopenArgs : this.get("reopenArguments"),
				features : this.get("features"),
				callback : this.get("callback"),
				oie : this.get("openInExisting"),
				cwp : this.get("closeWithParent")
			};
			return all(attrsReady).then(lang.hitch(this, function(attrs) {
				gkernel.asrt(attrs.href, "Missing href in LinkWidget.");
				
				var uri = Uri.resolve(Uri.fromWindow(), attrs.href);
				if (!attrs.callback || typeof attrs.callback != "function") {
					attrs.callback = null;
				}
				var wndPromise = tdi.open(option, uri, attrs.vArgs, attrs.features, attrs.callback, attrs.oie, attrs.reopenArgs, attrs.cwp);

				// convert promises to events && handle errors
				this._addTargetEvents(wndPromise, option);
				return wndPromise;
			})).otherwise(error.errbackDialog);
		},

		openDefault : function(e) {
			// summary:
			//		Navigate using default TDI option set for this widget.
			// returns: Window
			//		Opened window
			var tabAllowed = ~array.indexOf(this.get("enabledOptions"), "new");
			var option = e && e.button != null && mouse.isMiddle(e) && tabAllowed ? "new" : this.get("defaultOption");
			return this.open(option, e);
		},

		_updateTdiMenu : function() {
			if (this.disabled) {
				this.hideDropDown(true);
				return;
			}
			var enabledOptions = this.get("enabledOptions"), menuItems = this.dropDown.getChildren();
			for ( var j = 0; j < handlers.length; j++) {
				handlers[j].remove();
			}
			handlers = [];
			for ( var i = 0; i < tdi.optionKeys.length; i++) {
				var optionKey = tdi.optionKeys[i];
				var disabled = !~array.indexOf(enabledOptions, optionKey);
				this._updateMenuItem(menuItems[i], optionKey, disabled);
			}
			this.hideDropDown(!this.get("enabledOptions").length && this.get("hideDisabled"));
		},

		_updateMenuItem : function(item, optionKey, disabled) {
			handlers.push(item.on("click", lang.hitch(this, "open", optionKey)));
			item.set("disabled", disabled);

			this._hideNode(item.domNode, this.hideDisabled && disabled);
		},

		hideDropDown : function(hide) {
			// summary:
			//		Hides or shows widget's drop down
			this._hideNode(this.dropDown.domNode, hide);
		},

		_buildTdiMenu : function() {
			if (!dropDown) { // create default global menu
				dropDown = new Menu();
				for ( var i = 0; i < tdi.optionKeys.length; i++) {
					this._addMenuItem(messages[tdi.optionLabelCodes[tdi.optionKeys[i]]]);
				}
			}
			this.dropDown = dropDown;

			if (this.openDropDown) {
				this._dropDownHandle = aspect.before(this, "openDropDown", lang.hitch(this, this._updateTdiMenu));
			} else {
				// NTH make more effective
				this._dropDownHandle = aspect.before(this.dropDown, "_openMyself", lang.hitch(this, function(args) {
					if ((args.delegatedTarget || args.target) == this.domNode) {
						this._updateTdiMenu();
					}
				}));
			}
		},

		_addMenuItem : function(label) {
			var item = new MenuItem({
				label : label
			});
			dropDown.addChild(item);
			return item;
		},

		_hideNode : function(node, hide) {
			if (hide) {
				domClass.add(node, "gjaxHidden");
			} else {
				domClass.remove(node, "gjaxHidden");
			}
		},

		buildRendering : function() {
			this.inherited(arguments);
			this._buildTdiMenu();
		},

		startup : function() {
			if (this._started) {
				return;
			}
			this.inherited(arguments);
			this._updateTdiMenu();

			this.on("click", lang.hitch(this, "openDefault"));
		},

		destroy : function() {
			/*jshint expr:true */
			//destroy dropdown only if no other _LinkWidget exists
			if (--instancesCount === 0) {
				if (this.dropDown) {
					// Destroy the drop down, unless it's already been destroyed. This can happen because
					// the drop down is a direct child of <body> even though it's logically my child.
					if (!this.dropDown._destroyed) {
						this.dropDown.destroyRecursive();
					}
					delete this.dropDown;
					// remove pointer to global dropDown
					dropDown = null;
					// remove click handlers 
					for ( var j = 0; j < handlers.length; j++) {
						handlers[j].remove();
					}
				}
			} else {
				delete this.dropDown;
			}
			this._dropDownHandle && this._dropDownHandle.remove();
			this.inherited(arguments);
		}

	});
});