define([
	"dgrid/editor",
	"dijit/form/FilteringSelect",
	"dojo/_base/lang",
	"dojo/json",
	"gjax/XString",
	"dojo/_base/config"
], function(editor, FilteringSelect, lang, json, stringUtils, config) {

	function Item(obj){
		this.id = obj ? obj.id : null;
		this.name = obj ? obj.name : null;
	}
	Item.prototype.valueOf = function() {
		return this.id;
	};
	Item.prototype.isItem = function() {
		return true; // naive
	};

	var resolvedEnumSuffix = config.resolvedEnumSuffix;

	var resolvedEnumEditor = function(column) {
		var f = column.field;
		var suffix = column.resolvedEnumSuffix != null ? column.resolvedEnumSuffix : resolvedEnumSuffix;
		var resolvedField = column.resolvedField || (stringUtils.endsWith(f, "Id") ? f.substring(0, f.length - 2) : f) + suffix;
		column.get = function(data) {
			var val = lang.getObject(f, false, data);
			if (val && lang.isObject(val)) {
				return new Item(val);
			} else {
				var obj = {
					id : val
				};
				var resValue = lang.getObject(resolvedField, false, data);
				if (resValue) {
					obj.name = resValue;
				}
				return new Item(obj);
			}
		};
		column.set = function(data) {
			var val = lang.getObject(f, false, data);
			if (val && lang.isObject(val)) {
				if (val.id != null) {
					lang.setObject(resolvedField, val.name, data);
					lang.setObject(f, val.id, data);
				} else {
					lang.setObject(resolvedField, null, data);
					lang.setObject(f, null, data);
				}
			}
		};
		column.dataFromEditor = function(column, w) {
			if (!w.resolvedItem) {
				return {};
			}
			return new Item(json.parse(w.resolvedItem));
		};
		column.dataToEditor = function(column, w, value) {
			if (value && lang.isObject(value)) {
				w.set("resolvedItem", json.stringify(value));
			} else {
				w.set("value", value);
			}
		};

		return (column.editable === false) ? column : editor(column, column.editor || FilteringSelect);
	};
	
	resolvedEnumEditor._toItem = function(obj) {
		return new Item(obj);
	};
	
	return resolvedEnumEditor;
});