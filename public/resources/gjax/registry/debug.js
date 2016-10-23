// STABILITY: experimental
/**
 * Debug and development extensions for regisry and widgets TODO: once tuned move to gjax
 */
define([
	"dojo/_base/array",
	"dijit/Tooltip",
	"dojo/dom-class",
	"dojo/dom-style"
], function(array, Tooltip, domClass, domStyle) {

	var dbg = {
		showTooltipOnWidgets : function(widgets) {
			array.forEach(widgets, showTooltip);
			function showTooltip(item) {
				//TODO test this! e.g. what does it do, when tooltip already present?
				//TODO parametrize somehow data shown to make tooltip extensible?
				//TODO make styling of this tooltip different?
				new Tooltip({
					connectId : item.id,
					label : item.declaredClass,
					position : [
						"above"
					]
				});
			}

		},
		showTestIdTooltipOnWidgets : function(widgets) {
			array.forEach(widgets, showTooltip);
			function showTooltip(item) {
				//TODO test this! e.g. what does it do, when tooltip already present?
				//TODO parametrize somehow data shown to make tooltip extensible?
				//TODO make styling of this tooltip different?
				if (item.testId) {
					new Tooltip({
						connectId : item.id,
						label : item.testId,
						position : [
							"above"
						]
					});
				}
			}

		},
		colorizeWidgets : function(widgets) {

			array.forEach(widgets, colorizeWidget /*, thisObject*/);
			function colorizeWidget(widget) {
				//log.assert(widget.domNode!=null,"Works only on nodes with domNode"); //TODO; study
				//TODO: xstyle, inject debug classes
				//TODO: befare and set !important on the class ! (the case when class already exists)
				//widget.domClass.add(""); //TODO: only if not added already

				if (widget.domNode != null) {
					domStyle.set(widget.domNode, {
						border : "3px solid red"
					});
				}
			}

		},
		dumpWidgets : function(widgets) {
			var FORMAT = "%s\t\t\t\t%s\t%s\t%s\t%s\t";

			console.log(">dumpWidgets--------#%s-------------------------------------------", widgets.length);
			console.log(FORMAT, "widgetId", "declaredClass", "isContained", "domNode#id", "getParent");
			array.forEach(widgets, dumpWidget);
			console.log("<dumpWidgets------------------------------------------------------");

			//----------------------------------------------
			function dumpWidget(w) {
				var isContained = w.getParent && !!w.getParent();
				var domNode = dumpDomNode(w.domNode);
				console.log(FORMAT, w.id, w.declaredClass, isContained, domNode, w.getParent && w.getParent() && w.getParent().id);
			}
			function dumpDomNode(node) {
				if (!node) {
					return node + "";					
				}
				return node.tagName + "#" + node.id;
			}
		}
	};
	return dbg;
});