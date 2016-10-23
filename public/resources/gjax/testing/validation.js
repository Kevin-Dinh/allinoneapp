define([
	"dojo/query",
	"dojo/dom-style",
	"dojo/dom-class",
	"dijit/registry",
	"dojo/_base/array"

], function(query, domStyle, domClass, registry, array) {
	/*jshint expr:true */
	/*
	function messageDisplayed1(idOrWidget) {
		//not tested
		var w = registry.byId(idOrWidget);
		var validationContainer = query(".dijitValidationContainer", w.domNode)[0];
		return domStyle.get(validationContainer, "display") === "block";
	}
	*/

	function messageDisplayed2(idOrWidget) {
		return domClass.contains(registry.byId(idOrWidget).domNode, "dijitError");
	}
	function turnOff(widgetsOrWidget, redraw) {
		array.forEach(toArray(widgetsOrWidget), function(w) {
			if (w.validate) {
				w.___isValid = w.isValid;
				w.isValid = returnTrue;
				redraw && w.validate(); //cause redraw if requested
			}
		});
	}
	function turnOn(widgetsOrWidget, redraw) {
		array.forEach(toArray(widgetsOrWidget), function(w ) {
			if (w.validate) {
				w.isValid = w.___isValid;
				delete w.___isValid;
				redraw && w.validate(); //cause redraw if requested
			}
		});
	}

	function toArray(widgetsOrWidget) {
		return widgetsOrWidget instanceof Array ? widgetsOrWidget : [
			widgetsOrWidget
		];
	}

	function returnTrue() {
		return true;
	}

	return {
		// summary:
		//		Module that enables manipulation and chceking validation on form widgets
		messageDisplayed : messageDisplayed2,
		turnOff : turnOff,
		turnOn : turnOn
	};

});