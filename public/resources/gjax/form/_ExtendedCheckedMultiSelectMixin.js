define([
	"dojo/_base/declare",
	"dojo/_base/lang"
], function(declare, lang) {

	return declare(null, {
		// summary:
		//		Mixin that allows setting disabled and readolny per item
		// description:
		//		Use this mixin if you need to set enabled/readonly state per item.
		//		Module will allow to do this using isItemDisabled / ReadOnly methods
		// 		By default these methods checks 'disabled' / 'readOnly' property of the item
		_getOptionObjForItem : function(item) {
			var optionObj = this.inherited(arguments);
			return lang.mixin(optionObj, {
				disabled : this.isItemDisabled(item),
				readOnly : this.isItemReadOnly(item)
			});
		},
		isItemDisabled : function(item) {
			return this._checkItemProperty(item, "disabled");
		},
		isItemReadOnly : function(item) {
			return this._checkItemProperty(item, "readOnly");
		},
		_checkItemProperty : function(item, property) {
			//check if store has old API
			return !!(this.store.getValue ? this.store.getValue(item, property) : item[property]);
		}
	});
});