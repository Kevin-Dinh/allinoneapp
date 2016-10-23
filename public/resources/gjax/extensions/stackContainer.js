define([
	"dijit/layout/StackContainer",
	"gjax/log/level",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/topic"
], function(StackContainer, level, array, domConstruct, topic) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: StackContainer.destroyDescendants destroy children before removing itself from DOM");

	StackContainer.extend({
		destroyDescendants : function(/*Boolean*/preserveDom) {
			this._descendantsBeingDestroyed = true;
			this.selectedChildWidget = undefined;
			array.forEach(this.getChildren(), function(child) {
				//MR: find nested widgets and destroy them before removing child's wrapper from DOM
				//there was a problem when wrapper was removed first that nested widget 
				//which was using registry.findWidgets could not find anything in its domNode 
				//because it reality did not exists in DOM but only in memory 
				child.destroyRecursive(preserveDom);
				if (!preserveDom) {
					//this.removeChild(child);
					//we must put code from removeChild here

					domConstruct.destroy(child._wrapper);
					delete child._wrapper;
					if (this._started) {
						// This will notify any tablists to remove a button; do this first because it may affect sizing.
						topic.publish(this.id + "-removeChild", child);
					}
				}
				//moved above
				//child.destroyRecursive(preserveDom);
			}, this);
			this._descendantsBeingDestroyed = false;
		}
	});
});