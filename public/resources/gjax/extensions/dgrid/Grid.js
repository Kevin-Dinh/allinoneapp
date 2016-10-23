define([
	"dojo/_base/lang",
	"dojo/_base/declare",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dijit/_Widget",
	"gjax/formatters",
	"dgrid/Grid",
	"gjax/log/level"
], function(lang, declare, domConstruct, domAttr, _Widget, formatters, Grid, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: setting gjax/formatters as default formatterScope of dgrid");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: added support for reading nested properites in dgrid");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: added support for deferred values cells in dgrid");

	lang.extend(Grid, {
		//added to support default formatter scope
		formatterScope : formatters
	});

	//widget used when value is a deferred
	//will be placed into cell, and will replace itself for resolved value
	var _DeferredTextWidget = declare(_Widget, {
		deferred : null,
		columnNode : null,
		postCreate : function() {
			if (this.deferred && this.columnNode) {
				this.deferred.then(lang.hitch(this, deferredCallback), lang.hitch(this, deferredCallback));
			}
			function deferredCallback(text) {
				if (this.columnNode) {
					this.columnNode.innerHTML = text; /* git-qa *///value may contain HTML
				}
				this.destroyRecursive();
			}
		}
	});

	// override defaultRenderCell to support formatterScope and deferred formatters
	Grid.defaultRenderCell = function defaultRenderCell(object, data, td/*, options*/) {
		if (this.formatter) {
			// Support formatter, with or without formatterScope
			var formatter = this.formatter, formatterScope = this.grid.formatterScope;
			var v = typeof formatter === "string" && formatterScope ? formatterScope[formatter](data, object, this) : this.formatter(data, object, this);

			// Check if it's a deferred
			if (v && v.then) {
				td.innerHTML = ""; //some default value /* git-qa */
				var widget = new _DeferredTextWidget({
					deferred : v,
					columnNode : td
				}, domConstruct.create("span", {
					innerHTML : ""//this.defaultValue /* git-qa */
				}));
				widget.startup();
			} else {
				if (v != null) {
					td.innerHTML = v; /* git-qa *///value may contain HTML
				}
			}
		} else if (data != null) {
			td.appendChild(document.createTextNode(data));
		}

		if (this.titleFormatter) {
			// Support only formatter without formatterScope
			var t = this.titleFormatter(data, object, this);
			if (t != null) {
				domAttr.set(td, "title", t);
			}
		}
	};

});