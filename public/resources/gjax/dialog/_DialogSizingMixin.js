define([
	"dojo/_base/declare",
	"dojo/dom-geometry",
	"dojo/window",
	"dojo/dom-style",
	"dojo/_base/array",
	"dojo/has",
	"dijit/layout/utils"
], function(declare, domGeom, winUtils, domStyle, array, has, utils) {

	return declare(null, {

		useBodySize : false,

		_getScreenSize : function() {
			var viewport = winUtils.getBox(this.ownerDocument);
			// AR: do not use body size by default
			// smaller dialog with scrollbar is better than dialog larger than viewPort and scrolling whole body (which is also buggy in combination with dnd)
			if (!this.useBodySize) {
				return viewport;
			}
			
			var bodySize = domGeom.getMarginBox(document.body);
			// PM: if screen has define size use this size, otherwise use viewport
			// (but nobody remembers what was the reason for this)
			return {
				w : Math.max(viewport.w, bodySize.w),
				h : Math.max(viewport.h, bodySize.h)
			};
		},

		resize : function(dim) {
			// summary:
			//		Called with no argument when viewport scrolled or viewport size changed.  Adjusts Dialog as
			//		necessary to keep it visible.
			//
			//		Can also be called with an argument (by dojox/layout/ResizeHandle etc.) to explicitly set the
			//		size of the dialog.
			//
			//		extracted from dijit/Dialog
			// dim: Object?
			//		Optional dimension object like {w: 200, h: 300}

			if (this.domNode.style.display != "none") {

				this._checkIfSingleChild();

				if (!dim) {
					if (this._shrunk) {
						// If we earlier shrunk the dialog to fit in the viewport, reset it to its natural size
						if (this._singleChild) {
							if (typeof this._singleChildOriginalStyle != "undefined") {
								this._singleChild.domNode.style.cssText = this._singleChildOriginalStyle;
								delete this._singleChildOriginalStyle;
							}
						}
						array.forEach([
							this.domNode,
							this.containerNode,
							this.titleBar
						], function(node) {
							domStyle.set(node, {
								position : "static",
								width : "auto",
								height : "auto"
							});
						});
						this.domNode.style.position = "absolute";
					}

					// If necessary, shrink Dialog to fit in viewport and have some space around it
					// to indicate that it's a popup.  This will also compensate for possible scrollbars on viewport.
					var screenSize = this._getScreenSize();

					screenSize.w *= this.maxRatio;
					screenSize.h *= this.maxRatio;

					var bb = domGeom.position(this.domNode);
					if (bb.w >= screenSize.w || bb.h >= screenSize.h) {
						dim = {
							w : Math.min(bb.w, screenSize.w),
							h : Math.min(bb.h, screenSize.h)
						};
						this._shrunk = true;
					} else {
						this._shrunk = false;
					}
				}

				// Code to run if user has requested an explicit size, or the shrinking code above set an implicit size
				if (dim) {
					// Set this.domNode to specified size
					domGeom.setMarginBox(this.domNode, dim);

					// And then size this.containerNode
					var contentDim = utils.marginBox2contentBox(this.domNode, dim), centerSize = {
						domNode : this.containerNode,
						region : "center"
					};
					utils.layoutChildren(this.domNode, contentDim, [
						{
							domNode : this.titleBar,
							region : "top"
						},
						centerSize
					]);

					// And then if this.containerNode has a single layout widget child, size it too.
					// Otherwise, make this.containerNode show a scrollbar if it's overflowing.
					if (this._singleChild) {
						var cb = utils.marginBox2contentBox(this.containerNode, centerSize);
						// note: if containerNode has padding singleChildSize will have l and t set,
						// but don't pass them to resize() or it will doubly-offset the child
						this._singleChild.resize({
							w : cb.w,
							h : cb.h
						});
						// TODO: save original size for restoring it on another show()?
					} else {
						this.containerNode.style.overflow = "auto";
						this._layoutChildren(); // send resize() event to all child widgets
					}
				} else {
					this._layoutChildren(); // send resize() event to all child widgets
				}
				if (!has("touch") && !dim) {
					// If the user has scrolled the viewport then reposition the Dialog.  But don't do it for touch
					// devices, because it will counteract when a keyboard pops up and then the browser auto-scrolls
					// the focused node into view.
					this._position();
				}
			}
		}
	});
});
