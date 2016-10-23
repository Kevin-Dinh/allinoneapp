define([
	"dojo/_base/declare",
	"dojo/store/Memory",
	"dojo/_base/lang",
	"gjax/error",
	"gjax/store/RqlQueryEngine",
	"gjax/_base/kernel",
	"gjax/xml/X",
	"dojox/lang/functional",
	"dojo/string"
], function(declare, Memory, lang, error, RqlQueryEngine, gkernel, X, df, string) {

	// Module not used, so moved just to test
	
	return declare(Memory, {

		"-chains-" : {
			constructor : "manual"
		},
		constructor : function(options) {
			gkernel.asrt(options.xmlDoc != null, "options.xmlDoc is missing and is required");
			gkernel.asrt(options.itemsXpath != null, "options.itemsXpath is missing and is required");

			this.xmlDoc = options.xmlDoc;
			this.enumMappings = options.enumMappings;

			options.data = options.xmlDoc.nodes(options.itemsXpath).map(this._xmlToItem, this);
			this.inherited(arguments); // explicit call to parent.constructor
		},

		xmlDoc : null,
		itemsXpath : null,
		enumMappings : null,

		_xmlToItem : function(xmlDoc) {
			var item = xmlDoc.toObj();
			item._xmlDoc = xmlDoc;
			if (!(this.idProperty in item)) {
				item[this.idProperty] = Math.random();
			}

			if (this.enumMappings) {
				this._resolveEnums(item);
			}
			return item;
		},

		_resolveEnums : function(item) {
			df.forIn(this.enumMappings, function(xpathTemplate, enumProp) {
				if (enumProp in item) {
					var xpath = string.substitute(xpathTemplate, {
						val : item[enumProp]
					});
					var enumNode = this.xmlDoc.node(xpath);
					if (!enumNode) {
						return;
					}
					df.forIn(enumNode.toObj(), function(val, key) {
						item[enumProp + "_" + key] = val;
					});
				}
			}, this);
		},

		remove : function(id) {
			var item = this.get(id);
			if (!item) {
				return;
			}
			item._deleted = true;
			//TODO: do what is needed with the XML (some NIL marking)
		},

		get : function(/*id*/) {
			var item = this.inherited(arguments);
			if (item._deleted) {
				return null;
			}
			return item;
		},

		query : function(query, options) {
			if (!query) {
				query = {};
			}
			query._deleted = {
				test : function(isDeleted) {
					return !isDeleted;
				}
			};
			return this.inherited(arguments, [
				query,
				options
			]);
		},

		add : function(xmlDoc, options) {
			gkernel.asrt(xmlDoc && xmlDoc.isInstanceOf && xmlDoc.isInstanceOf(X._X), "xmlDoc must be instace of gjax/xml/X");

			var item = this._xmlToItem(xmlDoc);
			return this.inherited(arguments, [
				item,
				options
			]);
		},

		put : function(item, options) {
			if (!options || options.overwrite !== false) {
				gkernel.asrt(item._xmlDoc && item._xmlDoc.isInstanceOf && item._xmlDoc.isInstanceOf(X._X), "_xmlDoc must be present on item");
				lang.mixin(item, this._xmlToItem(item._xmlDoc));
			} //else we are called from add

			return this.inherited(arguments);
		}
	});
});