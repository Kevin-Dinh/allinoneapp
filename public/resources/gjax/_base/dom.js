define([
	"dojo/_base/kernel",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/dom-construct",
	"dojo/dom-geometry",
	"dojo/dom-class",
	"dojo/dom-prop"
], function(kernel, dom, domStyle, domConstruct, domGeometry, domClass, domProp) {

	function isVisible(elementNode, _top, _bottom) {
		// summary:
		//		Checks if element is visible according to scoll state of parents
		// description:
		//		Method check if node is visible (not according to css - display, visibility)
		// 		but according to scroll state of parents (if it is not scrolled away).
		//		In current implementation only vertical scrolling is checked.
		// elementNode: Node
		//		dom node to check
		// returns:	Boolean
		//		True if at least a part of node is visible
		var position = domGeometry.position(elementNode, true);

		_top = _top ? _top : (position.y);
		_bottom = _bottom ? _bottom : (position.h + _top);

		var parent = elementNode.parentNode;
		// return true for document node
		if (9 === parent.nodeType) {
			return true;
		}

		var parentPosition = domGeometry.position(parent, true);
		// if node is not inside visible area of parent block and parent is not relatively positioned, node is not visible
		if (!(_top >= parentPosition.y && _bottom <= (parentPosition.y + parentPosition.h)) && domStyle.getComputedStyle(parent).position !== "relative") {
			return false;
		}

		if (parent) {
			return isVisible(parent, _top, _bottom);
		}
	}

	function isDisplayed(node) {
		// summary:
		//		Checks if element is visible according to display and visibility status of parents
		if (!node) {
			return false;
		}
		// 9-document node
		if (node && node.nodeType == 9) {
			return true;
		}
		var style = domStyle.getComputedStyle(node);
		if (node.nodeType != 1 || style.visibility == "hidden" || style.display == "none") {
			return false;
		}
		return isDisplayed(node.parentNode);
	}

	function selectElement(element) {
		// summary:
		//		Selects all text in given node
		// element: Node
		//		Node to select
		if (window.getSelection) {
			var sel = window.getSelection();
			sel.removeAllRanges();
			var range = document.createRange();
			range.selectNodeContents(element);
			sel.addRange(range);
		} else if (document.selection) {
			var textRange = document.body.createTextRange();
			textRange.moveToElementText(element);
			textRange.select();
		}
	}

	return {
		hide : function(id) {
			// summary:
			//		Hides DOM Node.
			// id: String|DOMNode
			//		An id or a reference to a DOM Node.
			id = dom.byId(id);
			domClass.add(id, "gjaxHidden");
		},
		show : function(id) {
			// summary:
			//		Shows hidden domNode.
			// id: String|DOMNode
			//		An id or a reference to a DOM Node.
			id = dom.byId(id);
			domClass.remove(id, "gjaxHidden");
		},
		wrap : function(wrapId, refId) {
			// summary:
			//		Wraps `wrapNode` around `refNode`.
			// wrapNode: String|DOMNode
			//		An id or a reference to a DOM Node.
			//		Will be placed arround `refNode`.
			// refNode: String|DOMNode
			//		An id or a reference to a DOM Node. Will be wrapped by `wrapNode`.
			// returns:	DOMNode?
			//		Returns `wrapnode`

			// there is no dojo equivalent for this
			domConstruct.place(wrapId, refId, "before");
			domConstruct.place(refId, wrapId, "first");
			return wrapId;
		},
		setText : function(id, text) {
			// summary:
			//		Sets innerText of given node (fallback to textContent if innerText does not exists)
			// id: String|DOMNode
			//		An id or a reference to a DOM Node.
			// text: String
			//		Text to set

			kernel.deprecated("gjax/_base/dom.setText()", "Use dojo/dom-prop.set(node, 'textContent', value) instead.");
			domProp.set(id, "textContent", text);
		},
		getText : function(id) {
			// summary:
			//		GEtd innerText of given node (fallback to textContent if innerText does not exists)
			// id: String|DOMNode
			//		An id or a reference to a DOM Node.

			kernel.deprecated("gjax/_base/dom.getText()", "Use dojo/dom-prop.get(node, 'textContent') instead.");
			return domProp.get(id, "textContent");
		},
		isVisible : isVisible,
		isDisplayed : isDisplayed,
		selectElement : selectElement
	};
});
