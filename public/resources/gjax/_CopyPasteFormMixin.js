define([
	"dojo/_base/declare",
	"dojo/_base/event",
	"dojo/_base/lang",
	"dojo/json",
	"gjax/lang/whitelistMixin",
	"dijit/registry",
	"dijit/focus",
	"dojox/lang/functional",
	"dojox/lang/functional/fold"
], function(declare, event, lang, json, whitelistMixin, registry, focus, df) {
	return declare(null, {
		// summary:
		//		Mixin allows copy-pasting of values in fields from one form to an other
		// description:
		//		Mixin allows copy-pasting of values in fields from one form to an other (also between browsers).//		
		//		Support: IE7+, Chrome 	
		//		Limitations: Some text must be selected in IE (in one of the form fields) to fire copy event.
		// example:
		//		| <FORM data-dojo-type="dijit/form/Form" data-dojo-attach-point="form1" data-dojo-mixins="./_CopyPasteFormMixin" data-dojo-props="copyAttrs:'street,number,city',pasteAttrs:'number,city,zip'" method="post">
		
				
		// copyAttrs: String / Object / Array
		//		Description of tranformation of form value to clipboard data
		//		If value is falsy, no copying will be allowed
		//		May be deffined as array of property names or string coma separated property names, which defines allowed fields for copying.
		//		May be deffined as object, which property names defines allowed fields and values denotes property names that will appear in clipborad data.
		copyAttrs : null,
		_setCopyAttrsAttr : function(copyAttrs) {
			if (lang.isString(copyAttrs)) {
				copyAttrs = copyAttrs.split(",");
			}
			if (lang.isArray(copyAttrs)) {
				copyAttrs = df.reduce(copyAttrs, toKeyVal, {});
			}
			this._set("copyAttrs", copyAttrs);
		},

		// pasteAttrs: String / Object / Array
		//		Description of tranformation of clipboard data to form value
		//		If value is falsy, no asting will be allowed
		//		May be deffined as array of property names or string coma separated property names, which defines allowed fields for pasting.
		//		May be deffined as object, which property names defines allowed fields (in clipboard data) and values denotes field names.
		pasteAttrs : null,
		_setPasteAttrsAttr : function(pasteAttrs) {
			if (lang.isString(pasteAttrs)) {
				pasteAttrs = pasteAttrs.split(",");
			}
			if (lang.isArray(pasteAttrs)) {
				pasteAttrs = df.reduce(pasteAttrs, toKeyVal, {});
			}
			this._set("pasteAttrs", pasteAttrs);
		},

		copyTransform : function(data) {
			// summary:
			//		Transforms form data to data that will be JSON-ified and stored in clipboard
			// description:
			//		Overridable function that transform data before storing in clipboard.
			//		'copyAttrs' property is used to transform the data.
			// data: Object
			//		Data to transform
			// returns:	Object
			//		Data to store in clipborad. If returned value is null/undefined copy will be not executed
			return this.copyAttrs ? df.reduce(data, lang.partial(copyAndMap, this.copyAttrs), {}, this) : null;
		},

		pasteTransform : function(data) {
			// summary:
			//		Transforms clipborad data to data that will be set as form value (model)
			// description:
			//		Overridable function that transform data before filling them into the form.
			//		'pasteAttrs' property is used to transform the data.
			// data: Object
			//		Data to transform
			// returns:	Object?
			//		Data to fill into the form. If returned value is null/undefined paste will be not executed
			return this.pasteAttrs ? df.reduce(data, lang.partial(copyAndMap, this.pasteAttrs), {}, this) : null;
		},

		ignoredWidget: function() {
			return false;
		},
		
		_handleCopy : function(e) {
			var clipboardData = e.clipboardData || window.clipboardData;
			if (clipboardData) {
				var focusedWidget = registry.getEnclosingWidget(e.target);
				if (focusedWidget._setBlurValue) {
					focusedWidget._setBlurValue();
				}
				if (!this.ignoredWidget(focusedWidget, e)) {
					var data = this.copyTransform(this.get("target") || this.get("value"));
					if (data) {
						clipboardData.setData("Text", json.stringify(data));
						event.stop(e);
					}
				}
			}
		},

		_handlePaste : function(e) {
			var copyPasteDataString, clipboardData = e.clipboardData || window.clipboardData;
			var focusedWidget = registry.getEnclosingWidget(e.target);
			if (!this.ignoredWidget(focusedWidget, e) && clipboardData && (copyPasteDataString = clipboardData.getData("Text"))) {
				try {
					var data = this.pasteTransform(json.parse(copyPasteDataString));
					if (data != null) {
						var model = this.get("target");
						if (model) {
							model.set(data);
						} else {
							this.set("value", data);
						}
						event.stop(e);
					}
				} catch (e2) {
					//original paste
				}
			}
			//original paste
		},
		startup : function() {
			if (this._started) {
				return;
			}
			this.inherited(arguments);
			this.on("copy", lang.hitch(this, "_handleCopy"));
			this.on("paste", lang.hitch(this, "_handlePaste"));
		}
	});

	function toKeyVal(obj, val) {
		obj[val] = val;
		return obj;
	}

	function copyAndMap(attributesMap, data, val, key) {
		if (key in attributesMap) {
			data[attributesMap[key]] = val;
		}
		return data;
	}

});