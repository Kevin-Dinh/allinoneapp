define([
	"dojo/_base/lang",
	"dijit/form/_AutoCompleterMixin",
	"dijit/Tooltip",
	"dojo/i18n!./nls/_AutoCompleterMixin",
	"dojo/_base/array",
	"dojo/dom-attr", // domAttr.get
	"dojo/has",
	"dojo/keys",
	"gjax/log/level", "dojo/dom-prop"
], function(lang, _AutoCompleterMixin, Tooltip, i18n, array, domAttr, has, keys, level, domProp) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Selects/Combos display no data message when no results found");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Selects/Combos can display blank item in dropdown");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: Selects/Combos can highlight/autocomplete options without immediatelly affecting model");

	var origOnKey = _AutoCompleterMixin.prototype._onKey;

	_AutoCompleterMixin.extend({

		noDataMessage : i18n.noDataMessage,

		// displayBlankItem: Boolean
		//		When true, blank item is displayed in dropdown (when widget is not required).
		displayBlankItem : has("gjax-blank-in-select"),

		// blankItemLabel: String
		//		Label for blank item.
		blankItemLabel : " - ",

		// blankItemFirst: Boolean
		//		When true, blank item is first in list, otherwise it is last.
		blankItemFirst : true,
		
		// preventSetItemOnHighlight: Boolean
		//		When true, selecting option in dropdown will not cause immediate changes to model.
		//		Only Enter or bluring the widget will set the highlighted value to widget/model.
		//		In the same way, when `autoComplete` is true this also prevents changes of model when option is autocompleted.
		preventSetItemOnHighlight : false,
		
		_openResultList : function(/*Object*/results, /*Object*/query, /*Object*/options) {
			// summary:
			//		Callback when a search completes.
			// description:
			//		1. generates drop-down list and calls _showResultList() to display it
			//		2. if this result list is from user pressing "more choices"/"previous choices"
			//			then tell screen reader to announce new option
			var wasSelected = this.dropDown.getHighlightedOption();
			this.dropDown.clearResultList();
			if (!results.length && options.start === 0) { // if no results and not just the previous choices button
				this.closeDropDown();

				//MR display noDataMessage when no results found
				//if (this.isValid()) {
					this.noDataMessage && Tooltip.show(this.noDataMessage, this.domNode, this.tooltipPosition, !this.isLeftToRight());
				//}

				return;
			}
			this._nextSearch = this.dropDown.onPage = lang.hitch(this, function(direction) {
				results.nextPage(direction !== -1);
				this.focus();
			});
			
			var searchQuery = query[this.searchAttr].toString();

			// JU: display blank item for non-required selects, and only when user has not typed anyting
			if (this.displayBlankItem && !this.required && /^[*]+$/.test(searchQuery)) {
				// add empty item to dropdown
				var emptyItem = {
					_blank : true
				};
				emptyItem[this.labelAttr || this.searchAttr] = this.blankItemLabel;
				this.blankItemFirst ? results.unshift(emptyItem) : results.push(emptyItem);
			}

			// Fill in the textbox with the first item from the drop down list,
			// and highlight the characters that were auto-completed. For
			// example, if user typed "CA" and the drop down list appeared, the
			// textbox would be changed to "California" and "ifornia" would be
			// highlighted.

			this.dropDown.createOptions(results, options, lang.hitch(this, "_getMenuLabelFromItem"));

			// show our list (only if we have content, else nothing)
			this._showResultList();

			// #4091:
			//		tell the screen reader that the paging callback finished by
			//		shouting the next choice
			if ("direction" in options) {
				if (options.direction) {
					this.dropDown.highlightFirstOption();
				} else if (!options.direction) {
					this.dropDown.highlightLastOption();
				}
				if (wasSelected) {
					this._announceOption(this.dropDown.getHighlightedOption());
				}
			} else if (this.autoComplete && !this._prev_key_backspace
			// when the user clicks the arrow button to show the full list,
			// startSearch looks for "*".
			// it does not make sense to autocomplete
			// if they are just previewing the options available.
			&& !/^[*]+$/.test(searchQuery)) {
				var simpleQuery = searchQuery.toLowerCase().replace(/[*]+$/, ""); // remove trailing *
				array.some(this.dropDown.containerNode.children, function(node) {
					if (node == this.dropDown.nextButton || node == this.dropDown.previousButton) {
						return false; // ignore buttons
					}
					if (domProp.get(node, "textContent").toLowerCase().indexOf(simpleQuery) === 0) {
						this._announceOption(node, true); // 1st real item, which starts with searchQuery
						return true;
					}
				}, this);
			}
		},

		_announceOption : function(/*Node*/node, fromAutoComplete) {
			// summary:
			//		a11y code that puts the highlighted option in the textbox.
			//		This way screen readers will know what is happening in the
			//		menu.

			if (!node) {
				return;
			}
			// pull the text value from the item attached to the DOM node
			var newValue;
			if (node == this.dropDown.nextButton || node == this.dropDown.previousButton) {
				newValue = node.innerHTML;
				this.item = undefined;
				this.value = '';
			} else {
				var item = this.dropDown.items[node.getAttribute("item")];
				if (item._blank) {
					if (this._isArrowProcessing) {
						return; // AR: flag set by _onKey extension (see below)
					}
					// JU: special handling for blank item
					this.item = null;
					newValue = "";
					this.set('displayedValue', newValue);
				} else {
					newValue = (this.store._oldAPI ? // remove getValue() for 2.0 (old dojo.data API)
					this.store.getValue(item, this.searchAttr) : item[this.searchAttr]).toString();
					// JU: check preventSetItemOnHighlight
					if (!this.preventSetItemOnHighlight || (!this._isArrowProcessing && !fromAutoComplete)) {
						this.set('item', item, false, newValue);
					}
				}
			}
			// get the text that the user manually entered (cut off autocompleted text)
			this.focusNode.value = this.focusNode.value.substring(0, this._lastInput.length);
			// set up ARIA activedescendant
			this.focusNode.setAttribute("aria-activedescendant", domAttr.get(node, "id"));
			// autocomplete the rest of the option to announce change
			this._autoCompleteText(newValue);
		},

		_onKey : function(/*Event*/evt) {
			//AR: if we navigate to empty item using arrow do not annouce this option
			//prevent announcing by flag on widget, which is processed in above method
			var key = evt.charCode || evt.keyCode;
			switch (key) {
			case keys.PAGE_DOWN:
			case keys.DOWN_ARROW:
			case keys.PAGE_UP:
			case keys.UP_ARROW:
				this._isArrowProcessing = true;
			}
			var retVal = origOnKey.apply(this, arguments);
			delete this._isArrowProcessing;

			return retVal;
		},
		
		_startSearchAll: function() {
			this._startSearch('', true);
		}

	});
});
