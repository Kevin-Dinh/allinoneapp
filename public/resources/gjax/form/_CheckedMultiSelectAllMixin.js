define([
	"dojo/_base/declare",
	"dojox/form/CheckedMultiSelect",
	"dojo/i18n!./nls/_CheckedMultiSelectAllMixin",
	"dojo/_base/array"
], function(declare, CheckedMultiSelect, i18n, array) {

	var Item = declare(CheckedMultiSelect.formCheckedMultiSelectItem, {
		_changeBox : function() {
			if (this.option.value != this.parent.allValue) {
				return this.inherited(arguments);
			}

			if (this.get("disabled") || this.get("readOnly")) {
				return;
			}
			var selected = this.option.selected = this.checkBox.get("value") && true;

			array.forEach(this.parent.options, "item.selected=" + selected);

			this.parent._allOptionProcessing = true;
			this.parent._updateSelection(true);
			this.defer(function() {
				this.parent._allOptionProcessing = false;
			}, 1);
			// refocus the parent
			this.parent.focus();
		}
	});

	return declare(null, {

		allValue : "_all",
		allLabel : i18n.all,

		multiple : true,

		_loadChildren : function() {
			this.inherited(arguments);
			var option = {
				label : this.allLabel,
				value : this.allValue
			};

			var item;
			if (this.dropDown) {
				throw new Error("not implemented for dropDown variant");
//				item = new CheckedMultiSelect.formCheckedMultiSelectMenuItem({
//					option : option,
//					parent : this.dropDownMenu
//				});
//				this.dropDownMenu.addChild(item, 0);
			} else {
				item = this._allItem = new Item({
					option : option,
					parent : this,
					disabled : this.disabled,
					readOnly : this.readOnly
				});
				item.placeAt(this.wrapperDiv, "first");
				item.startup();
			}
		},

		_handleOnChange : function() {
			if (this._allItem && !this._allOptionProcessing) {
				this._allItem.option.selected = array.every(this.options, "return item.selected");
				this._allItem.checkbox && this._allItem._updateBox();
			}
			this.inherited(arguments);
		},
		
		toggleAll: function(selected){
			array.forEach(this.options, "item.selected=" + selected);
			this._updateSelection(true);
		}
	});

});
