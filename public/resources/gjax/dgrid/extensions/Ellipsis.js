define([
	"dojo/_base/declare",
	"dgrid/util/mouse",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dojo/dom-prop",
	"dojo/dom-style",
	"dojo/dom-geometry",
	"dojox/html/metrics",
	"dojo/dom-class",
	"gjax/encoders/html/encodeSmp"
], function(declare, mouse, lang, domAttr, domProp, domStyle, domGeom, metrics, domClass, encHtml) {

	return declare(null, {
		// summary:
		//		Mixin that ensures that title attribute is set on ellipsed cells.
		// description:
		//		This mixins setups hooks for mouse enter on cells and checks if innerText width (dojox/html/metrics) is bigger
		//		than contentBox of the cell.
		//
		//		'.ellipsisCell' CSS class is added to each ellipsed cell
		startup : function() {
			if (this._started) {
				return;
			}
			this.inherited(arguments);

			this.on(mouse.enterCell, lang.hitch(this, checkEllipsis));
			this.on(mouse.enterHeaderCell, lang.hitch(this, checkEllipsis));
		}
	});

	function checkEllipsis(evt) {
		var cell = this.cell(evt);
		if (cell.element && !(cell.column && (cell.column.titleFormatter || cell.column.noElipsis))) { // ignore cells with manual title (via titleFormatter)
			var _isEllipsisActive = isEllipsisActive(cell.element);
			domAttr.set(cell.element, "title", _isEllipsisActive ? domProp.get(cell.element, "textContent").trim() : "");
			domClass.toggle(cell.element, "ellipsisCell", _isEllipsisActive);
		}
	}

	function isEllipsisActive(e) {
		var s = domStyle.getComputedStyle(e);
		var obj = {
			fontSize : s.fontSize,
			fontWeight : s.fontWeight,
			fontFamily : s.fontFamily,
			whiteSpace : "nowrap"
		};
		var tb = metrics.getTextBox(encHtml(domProp.get(e, "textContent")), obj);
		var cb = domGeom.getContentBox(e);

		var expandoEl; //expando element (triangle icon) of tree view
		if (e.children && e.children.length) {
			var className = e.children[0].className;
			if (className) {
				var pattern = new RegExp("dgrid-expando-icon");
				if (pattern.test(className)) {
					expandoEl = domGeom.getContentBox(e.children[0]);
				}
			}
		}

		return expandoEl ? cb.w < (tb.w + expandoEl.w) : cb.w < tb.w;
	}
});