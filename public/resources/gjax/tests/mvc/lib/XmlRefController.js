define([
	"dojo/_base/declare",
	"dojox/mvc/ModelRefController",
	"gjax/mvc/ModelRefController",
	"dojo/_base/lang",
	"gjax/_base/object",
	"gjax/xml/X",
	"gjax/mvc/at",
	"gjax/_base/kernel",
	"dojo/Stateful"
], function(declare, ModelRefController, GModelRefController, lang, gobject, X, at, gkernel, Stateful) {

	// Module not used, so moved just to test

	var StatefulXml = declare(Stateful, {
		constructor : function(xmlDoc) { // default auto chaining
			gkernel.asrt(xmlDoc && xmlDoc.isInstanceOf && xmlDoc.isInstanceOf(X._X), "xmlDoc must be instace of gjax/xml/X");
			this._xmlDoc = xmlDoc;
			this._attrPairNames = {}; //override parent cache, which si across all instances
		},

		postscript : function() {
			//override parent not to call set on all const params
		},

		_get : function(xpath) {
			var node = this._xmlDoc.node(xpath);

			if (node == null) {
				throw new Error("Cannot bind. evalNode returns null:" + xpath + ",bindContext:" + this._xmlDoc);
			}

			if (node.nodes("*").length) { // this node has child nodes, so someone is binding mvc/group
				return new StatefulXml(node);
			}

			var xsdStr = node.getText();
			gkernel.asrt(xsdStr != null, "unexpected null xsdStr"); //ale moze byt ""
			return xsdStr;
		},

		_set : function(xpath, value) {
			var node = this._xmlDoc.node(xpath);
			gkernel.asrt(node != null, "Cannot persist. evalNode returns null:" + xpath);
			node.setText(value);
		},

		_getAttrNames : function(name) {
			// _set does not exists in Stateful (it's _Widget concept), but we want use it, to preserve parent 'set' method 
			var apn = this._attrPairNames;
			if (apn[name]) {
				return apn[name];
			}
			var setter = "_" + name + "Setter";
			if (!(setter in this)) {
				this[setter] = lang.hitch(this, "_set", name);
			}
			return (apn[name] = {
				s : setter,
				g : "_" + name + "Getter"
			});
		}
	});

	return declare(ModelRefController, {

		loadModelFromData : function(xmlDocument) {
			// summary:
			//		Loads xmlDocument as current data model.
			// data: gjax/xml/X
			// returns: XmlRefController

			this.set("model", new StatefulXml(xmlDocument));
			return this;
		},

		reset : function() {
			//TODO: implement
		},

		bind : GModelRefController.prototype.bind
	});

});
