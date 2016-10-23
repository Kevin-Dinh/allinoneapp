define([
	"../json/schema/_traverseSchemaTypes",
	"dojo/_base/lang",
	"dojox/lang/functional",
	//
	"dojox/lang/functional/fold"
], function(traverse, lang, df) {

	var defaultCtorCfg = {
		"string" : "ValidationTextBox",
		"date" : "dojox/form/DateTextBox",
		"number" : "NumberTextBox",
		"integer" : "NumberTextBox",
		"boolean" : "CheckBox",
		"array" : "dgrid/OnDemandGrid,dgrid/extensions/DijitRegistry",
		"object" : function(/*s*/) {
			//return "object";
		},
		"union" : function(/*s*/) {
			//return "Union:" + s.type[0]; //NTH: implement
		}
	};

	var createFactory = function(ctorCfg) {
		var propsCfg = {
			"array" : function(s) {
				return {
					selectionMode : "single",
					columns : s.items.properties && df.map(s.items.properties, function(col, name) {
						return name;
					})
				};
			}
		};
		var cnstrCfg = {
			integer : {
				places : 0
			}
		};
//		var minMaxCfg = {
//
//		};

		return function $defaultFactory(schema, path) {

			function _value(cfg, key) {
				if (typeof key == "function") {
					return key;
				}
				var v = cfg[key];
				return typeof v == "function" ? v(schema, path) : v;
			}

			var typeName = schema.type;
			if (traverse.isUnion(schema)) {
				//if there are right 2 types in union and one of them is NULL, take the second as type
				if (schema.type.length == 1) {
					typeName = schema.type[0];
				} else if (schema.type.length == 2) {
					typeName = schema.type[0] == "null" ? schema.type[1] : (schema.type[1] == "null" ? schema.type[0] : "union");
				} else {
					typeName = "union";
				}
			}

			if (typeName == "string" && (schema.format == "date" || schema.format == "date-time")) {
				typeName = "date";
			}
			return {
				ctor : _value(ctorCfg, typeName),
				props : lang.mixin({
					label : path,
					constraints : _value(cnstrCfg, typeName)
				}, _value(propsCfg, typeName))
			};
		};

	};

	//-------------------------------------------------------------

	function schema2Dojo(schema, /*?*/factory /*signature is (schema, path)->{meta object}*/) {
		/*jshint expr:true */
		factory || (factory = createFactory(defaultCtorCfg));

		function visitor(schema, path) { //quite dummy visitor, delegates all to factory
			schema._meta = lang.mixin(schema._meta, factory(schema, path)); //enhance if exists, create if not
			return schema;
		}
		return traverse(schema, "", visitor);
	}

	schema2Dojo.createFactory = createFactory;
	schema2Dojo.defaultCtorCfg = defaultCtorCfg;
	return schema2Dojo;

});