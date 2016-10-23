define([
	"require",
	"dojo/_base/lang",
	"dojo/Deferred",
	"../json/schema/_traverseSchemaTypes",
	"dojo/_base/array",
	"dojo/when",
	"dojo/promise/all"
], function(_require, dlang, Deferred, traverse, array, when, all) {

	//Mobile:	this.instantiate = function(/* DomNode[] */nodes, /* Object? */mixin, /* Object? */options){
	//Desktop:  instantiate: function(nodes, mixin, options)

	//TODO: cleanup and understand mixins, and options from original parser

	var parser = {
		parse : function(schema, options) {
			var self = this;
			return self.scan(schema, options).then(function(parsedNodes) {

				//console.debug(parsedNodes);
				return self.instantiate(parsedNodes, null, options);
			});
		},
		scan : function(rootSchema/*, options*/) {
			// returns list of _metas with ctor being Function now
			// trying to do the same thing as dojo/parser#scan
			var promises = [], //collects promises from all "recursive visits", both filled by _scan
			self = this;
			rootSchema = dlang.clone(rootSchema);//dont touch original schema anymore	
			traverse(rootSchema, "", _loadDependencies); //run through schema structure

			return all(promises).then(function() { //when all ctors
				//assert, all potential widgets have _meta.ctor set
				return rootSchema;
			});
			//----------------------------------------------------------------------------
			// each promise represents constructor of widget

			function _loadDependencies(s/*, path*/) {
				var meta = s._meta;
				if (meta && meta.ctor && typeof meta.ctor == "string") {
					var mids = array.map(meta.ctor.split(","), self.expandMid);
					var ctorPromise = getCtor(mids).then(function(ctor) {
						meta.ctor = ctor;
					});
					promises.push(ctorPromise);

				} else {
					//console.debug("no _meta.ctor on path:", path);
				}
			}
			function getCtor(mids) {

				// from list of mids, requires all and creates mixin if needed
				// returns promise
				//console.debug(">parser.getCtor:", mids);
				var d = new Deferred();
				_require(mids, createClass);
				return d;

				function createClass(/*W1,W2,W3*/) {
					var types = arguments, base = types[0], mixins, c;
					if (types.length > 1) {
						mixins = Array.prototype.slice.call(arguments, 1);
						c = base.createSubclass(mixins);
					} else {
						c = base;
					}
					//console.debug("<parser.getCtor:", mids);
					d.resolve(c);
				}
			}
		},
		instantiate : function(schema, mixin, options) {
			/*jshint expr:true */
			mixin || (mixin = {});
			options || (options = {});
			var widgets = [], subordinates = [];
			var subordinate;

			function isObjectType(schema) {
				if (schema.type == "object") {
					return true;
				}
				/*jshint laxbreak:true*/
				return dlang.isArray(schema.type) && schema.type.length == 2
						&& ((schema.type[0] == "object" && schema.type[1] == "null") || (schema.type[1] == "object" && schema.type[0] == "null"));
			}

			if (schema) {
				if (isObjectType(schema)) {
					var properties = schema.properties;
					for ( var fieldName in properties) { //nested fields
						var field = properties[fieldName];
						if (isObjectType(field)) {
							field._name = fieldName;
							subordinate = options && options.handleObject ? options.handleObject(field, mixin, options, fieldName) : this.instantiate(field,
									mixin, options);
							subordinates.push(subordinate);
						} else if (field.type == "array") {
							var items = field.items;
							if (dlang.isArray(items)) {
								subordinate = {};
								var subordinateItems = subordinate.items = [];
								var itemsLength = items.length;
								subordinate.isArray = true;
								subordinate.name = fieldName;
								for (var i = 0; i < itemsLength; i++) {
									var subordinateItem = options && options.handleArray ? options.handleArray(field.items[i], mixin, options, fieldName)
											: this._handleWidget(field.items[i], mixin, options);
									subordinateItems.push(subordinateItem);
								}
							} else {
								field.items._name = fieldName;
								subordinate = options && options.handleArray ? options.handleArray(field, mixin, options, fieldName) : this._handleWidget(
										field, mixin, options);
								subordinate.isArray = true;
							}
							subordinates.push(subordinate);
						} else { //simple fields //NTH type can be array
							widgets.push(options && options.handleWidget ? options.handleWidget(field, mixin, options, fieldName) : this._handleWidget(field,
									mixin, options));
						}
					}
				} else if (schema.type == "array") {
					subordinate = options && options.handleArray ? options.handleArray(schema, mixin, options, null) : this._handleWidget(schema, mixin,
							options);
					subordinate.isArray = true;
					subordinates.push(subordinate);
				}

			}
			return {
				_schema : schema,
				name : schema._name,
				widgets : widgets,
				subordinates : subordinates
			};
		},
		construct : function(ctor, params, node) {
			//simplified version of parser.js#construct method
			var proto = ctor && ctor.prototype;
			var markupFactory = ctor.markupFactory || proto.markupFactory;
			var instance = markupFactory ? markupFactory(params, node, ctor) : new ctor(params, node);
			return when(instance, onInstantiate); //promiseOrValue based on original instance being  promise or value

			function onInstantiate(instance) {
				var jsname = params["data-dojo-id"]; //jsid dropped (see parser.js and 2.0 support)
				// map it to the JS namespace if that makes sense
				if (jsname) {
					dlang.setObject(jsname, instance);
				}
				//[2] rest of code removed not needed, deals only with 
				// <script tag parsed aspects = [],calls=[],watches=[],ons=[];
				return instance;
			}
		},
		expandMid : function(mid) {
			//short names are considered to be from dijit/form module
			//override if needed
			return mid.split("/").length === 1 ? "dijit/form/" + mid : mid;
		},
		_handleWidget : function(field, mixin, options) {
			var props = field._meta.props;
			for ( var propName in props) {
				if (props[propName] == null) {
					delete props[propName];
				}
			}
			var params = dlang.mixin({}, props, options.defaults, mixin);
			return this.construct(field._meta.ctor, params);
		}

	};
	return parser;

});