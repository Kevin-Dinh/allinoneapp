define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom",
	"dijit/_WidgetBase",
	"dojo/regexp",
	"gjax/formatters"
], function(declare, lang, dom, _WidgetBase, regexp, formatters) {

	return declare("dojox.mvc.Output", _WidgetBase, {/* git-qa */
		// summary:
		//		A simple widget that displays templated output, parts of which may
		//		be data-bound.
		//
		// description:
		// 		Extended from dojox/mvc/Output, that allows to choose exprchar in the
		// 		same way as in dojox/mvc/Repeater
		// 		Default is changed from '$' to '!'
		// 		Each evaluated template may be formatetd by a formatter (function
		// 		same as in Grid defined via 'formatter' attribute) before it's
		// 		transormed to string. You can speciafy name of function from
		// 		'gjax.formatters' as a string.

		//		Simple output example:
		//
		//		|  <span data-dojo-type="dojox/mvc/Output" data-dojo-props="value: at(model, 'balance')"></span>
		//
		//		Another simple output example:
		//
		//		|  <span data-dojo-type="dojox/mvc/Output" data-dojo-props="value: at(model, 'balance')">
		//		|    Your balance is: ${this.value}
		//		|  </span>
		//
		//
		//		The output widget being data-bound, if the balance changes in the
		//		model, the content within the `<span>` will be
		//		updated accordingly.

		// exprchar:  Character
		//		Character to use for a substitution expression, for a substitution string like ${this.value}
		//		If this class is declared in a template HTML and exprchar is used in in-line template of this class, something other than `$` should be specified to avoid conflict with exprchar of outer-template.
		exprchar : '!',

		// templateString: [private] String
		//		The template or data-bound output content.
		templateString : "",

		formatter : formatters.defaultFormatter,

		// constraint: Object?
		//		Constraint for formatter
		constraint : null,

		_setFormatterAttr : function(value) {
			if (lang.isString(value)) {
				if (!(value in formatters)) {
					console.warn("Function '" + value + "' is not in 'gjax.formatters', defaultFormatter will be used.");
					this.formatter = formatters.defaultFormatter;
				} else {
					this.formatter = formatters[value];
				}
			} else {
				this.formatter = value;
			}
			this._output();
		},

		formatValue : function(value) {
			if (this.formatter) {
				return this.formatter(value, null, {
					constraint : this.constraint
				});
			}
			return value;
		},

		postscript : function(params, srcNodeRef) {
			// summary:
			//		Override and save template from body.
			this.srcNodeRef = dom.byId(srcNodeRef);
			if (this.srcNodeRef) {
				this.templateString = this.srcNodeRef.innerHTML; /* git-qa */
				this.srcNodeRef.innerHTML = ""; /* git-qa */
			}
			this.inherited(arguments);
		},

		set : function(name/*, value*/) {
			// summary:
			//		Override and refresh output on value change.
			// name:
			//		The property to set.
			// value:
			//		The value to set in the property.
			this.inherited(arguments);
			if (name === "value") {
				this._output();
			}
		},

		//AR: added reset, so mvc sync clears value if not specified on model
		reset : function() {
			this.set("value", undefined); //do not use  "", because it would assing it to undefine/null values
		},

		////////////////////// PRIVATE METHODS ////////////////////////

		_updateBinding : function(/*name, old, current*/) {
			// summary:
			//		Rebuild output UI if data binding changes.
			// tags:
			//		private
			this.inherited(arguments);
			this._output();
		},

		_output : function() {
			// summary:
			//		Produce the data-bound output.
			// tags:
			//		private
			var outputNode = this.srcNodeRef || this.domNode;
			outputNode.innerHTML = this.templateString ? this._exprRepl(this.templateString) : this.formatValue(this.value); /* git-qa *///HTML template
		},

		_exprRepl : function(tmpl) {
			// summary:
			//		Does substitution of ${foo+bar} type expressions in template string.
			// tags:
			//		private
			var pThis = this, transform = function(value/*, key*/) {
				if (!value) {
					return "";
				}
				var exp = value.substr(2);
				exp = exp.substr(0, exp.length - 1);
				/*jshint withstmt:true */
				with (pThis) {
					/*jshint evil:true */
					var val = eval(exp);
					return (val || val === 0 ? val : "");
				}
			};
			transform = lang.hitch(this, transform);
			return tmpl.replace(new RegExp(regexp.escapeString(pThis.exprchar) + "(\\{.*?\\})", "g"), function(match, key) {
				if (pThis.formatter) {
					return pThis.formatter(transform(match, key));
				}
				return transform(match, key).toString();
			});
		}
	});
});
