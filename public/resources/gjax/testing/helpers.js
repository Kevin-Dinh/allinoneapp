define([
	"dijit/registry",
	"dojo/_base/array",
	"dojo/query",
	"dijit/form/Form"
], function(registry, array, query, Form) {

	var win = window || {}; /*this line is needed to prevent error in build, because there is no 'window' in rhino and node*/
	win.testing = {
		getWidgetId : getWidgetId,
		isBlocking : isBlocking,
		toggleValidation : toggleValidation,
		log : log
	};

	function getWidgetId(parentId, targetProperty) {
		// summary:
		// 		get widget unique id based on widget parent and ref (dojox/mvc)
		// 		used in gui tests to evaluate selectors
		// description:
		//		targetPoperty: samples
		// 			name
		// 			name~
		// 			name~3
		// 
		// 		~ has one purpose, inside parentWidget we can have several getChildren, and 
		// 		two or more of them can be bound to the same model ref 
		// 		so name~3 probably means: find getChildren/getAllChildren widget that is bound to "name" property of model
		// 		but do not return first one but the 3rd one (or 4th ?) indexing is unclear to me 
		// parentId: String
		//      First argument to this function
		// targetProperty: String
		//      Second argument to this function
		// returns: 
		//      return string if child id is founded or undefined
		// REVIEW: please review docs.... I have wrote down what I have understood

		var parentWidget = registry.byId(parentId);
		var targetPropertyParts = targetProperty.split("~");
		targetProperty = targetPropertyParts[0];
		var order = targetPropertyParts[1] || 0;
		var childId, childOrder = 0;
		/*use getAllChildren for widgtes where getChildren is overriden*/
		var getChildren = parentWidget.getAllChildren || parentWidget.getChildren;
		if (getChildren) {
			array.some(getChildren.call(parentWidget), function(child) {
				var refs = child._refs;
				if (refs) {
					var binding = (refs.value || refs.checked);
					if (binding && binding.targetProp === targetProperty && (order == childOrder++)) {
						childId = child.id;
						return true;
					}
				}
				childId = getWidgetId(child.id, targetProperty);
				return !!childId;
			});
		}
		return childId;
	}

	function isBlocking() {
		// summary:
		//		check is gui blocking is visible
		// returns: 
		//		boolean value, true if blovking is visible
		return query(".appGuiBlocking").some(function(node) {
			var w = registry.getEnclosingWidget(node);
			return w.isVisible && w.isVisible();
		});
	}

	function toggleValidation(enable) {
		// summary:
		//		turns on/off validation on form
		// description:
		//		validity of screen is in most cases realised by calling form.validate
		//		replacing this method will cause turning validation off
		//		this method should be used from UI tests
		// returns: 
		//		boolean value, true if blovking is visible

		//	Form does not have own 'validate' method (but inherited from _FormMixin)
		//	so we can only add new method to override inherited one
		if (enable == null) {
			enable = Form.prototype.hasOwnProperty("validate");
		}
		if (enable) {
			delete Form.prototype.validate;
		} else {
			Form.prototype.validate = function() {
				return true;
			};
		}
	}

	function log(string) {
		console.log(string);
	}

});