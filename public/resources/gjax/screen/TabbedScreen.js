define([
	"dojo/_base/declare",
	"dojo/_base/window",
	"./ScreenBase",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/aspect",
	"dojo/_base/lang",
	"dijit/Viewport",
	"dojo/dom-geometry"
], function(declare, win, ScreenBase, domStyle, domClass, aspect, lang, Viewport, domGeom) {

	//TODO: handling of message panes in SPA

	return declare(ScreenBase, {

		allowSingleChild : true,
		doLayout : true,

		constructor : function() {
			this.baseClass += " gjaxTabbedScreen";
		},

		_attachMessagePane : function() {
			this.messagePaneRef.placeAt(this.tabContainer.selectedChildWidget.containerNode, "first");
		},

		startup : function() {
			if (this._started) {
				return;
			}

			this.inherited(arguments);

			//create message pane
			this.messagePaneRef = this.createMessagePane(this.containerNode, "last");

			//hook to changing tabs, so we can place message pane to currently open tab
			this.own(aspect.after(this.tabContainer, "selectChild", lang.hitch(this, "_attachMessagePane")));
			//if we already have selected child, place the messagePane
			if (this.tabContainer.selectedChildWidget) {
				this._attachMessagePane();
			}

			var p = this.getParent();
			//object to hold various original values, methods - that will be returned back to original state in destroy 
			this._orig = {};
			if (p) {
				//change the '_checkIfSingleChild' method of parent to treat this screen as its single child
				this._orig._checkIfSingleChild = p._checkIfSingleChild;
				p._checkIfSingleChild = lang.hitch(p, function(singleChild) {
					this._singleChild = singleChild;
					domClass.toggle(this.containerNode, this.baseClass + "SingleChild", true);
				}, this);
			}

			//remember original padding and border of parent node
			var pNode = this._orig.pNode = p ? p.domNode : this.domNode.parentNode;
			this._orig.pNodeBorder = domGeom.getBorderExtents(pNode);
			this._orig.pNodePadding = domGeom.getPadBorderExtents(pNode);

			//we cannot use class for reducing border and padding, because it is not applied on time (befor calling resize)
			setBorder(pNode, 0); //set only width so we other border properties are kept
			domStyle.set(this._orig.pNode, {
				padding : 0
			});

			domStyle.set(this.domNode, {
				padding : 0,
				overflow : "hidden"
			});

			this.tabContainer.doLayout = true;

			domClass.add(win.body(), "tabbedScreen");

			Viewport.emit("resize");
		},
		destroy : function() {
			var p = this.getParent();
			if (p) {
				p._checkIfSingleChild = this._orig._checkIfSingleChild;
				delete p._singleChild;
			}
			setPadding(this._orig.pNode, this._orig.pNodePadding);
			setBorder(this._orig.pNode, this._orig.pNodeBorder);

			domClass.remove(win.body(), "tabbedScreen");

			this.inherited(arguments);
		}
	});

	//TODO: DRY
	function setBorder(node, border) {
		var isObject = lang.isObject(border);
		domStyle.set(node, {
			"border-bottom-width" : (isObject ? border.b : border) + "px",
			"border-top-width" : (isObject ? border.t : border) + "px",
			"border-left-width" : (isObject ? border.l : border) + "px",
			"border-right-width" : (isObject ? border.r : border) + "px"
		});
	}
	function setPadding(node, padding) {
		var isObject = lang.isObject(padding);
		domStyle.set(node, {
			"border-bottom-width" : (isObject ? padding.b : padding) + "px",
			"border-top-width" : (isObject ? padding.t : padding) + "px",
			"border-left-width" : (isObject ? padding.l : padding) + "px",
			"border-right-width" : (isObject ? padding.r : padding) + "px"
		});
	}

});