define([
	"dojo/_base/lang",
	"dojox/json/ref",
	"../uri/Uri",
	"dojo/date/stamp",
	"gjax/error",
	"dojo/json"
], function(lang, dojoxRef, Uri, stamp, error, json) {
	/*jshint maxcomplexity:50 */

	function resolvePath(path) {
		if (path.indexOf("/") !== 0) {
			throw error.newError(new Error(), "path must be root relative", null, "gjax/json/ref", "IllegalArgumentException");
		}
		var resolved = Uri.stripOrigin(Uri.resolve(null, path));
		return resolved;
	}

	//inspired by dojox/json/ref
	//but with better path resolving
	var ref = lang.mixin({}, dojoxRef, {
		resolveJson : function(/*Object*/root, /*Object?*/args) {
			// summary:
			//		Indexes and resolves references in the JSON object.
			// description:
			//		A JSON Schema object that can be used to advise the handling of the JSON (defining ids, date properties, urls, etc)
			// root:
			//		The root object of the object graph to be processed
			// args:
			//		Object with additional arguments:
			//
			//		- The *index* parameter:
			//			This is the index object (map) to use to store an index of all the objects.
			//			If you are using inter-message referencing, you must provide the same object for each call.
			//		- The *defaultId* parameter:
			//			This is the default id to use for the root object (if it doesn't define it's own id)
			//		- The *idPrefix* parameter:
			//			This the prefix to use for the ids as they enter the index. This allows multiple tables
			//			to use ids (that might otherwise collide) that enter the same global index.
			//			idPrefix should be in the form "/Service/".  For example,
			//			if the idPrefix is "/Table/", and object is encountered {id:"4",...}, this would go in the
			//			index as "/Table/4".
			//		- The *idAttribute* parameter:
			//			This indicates what property is the identity property. This defaults to "id"
			//		- The *assignAbsoluteIds* parameter:
			//			This indicates that the resolveJson should assign absolute ids (__id) as the objects are being parsed.
			//		- The *schemas* parameter:
			//			This provides a map of schemas, from which prototypes can be retrieved
			//		- The *loader* parameter:
			//			This is a function that is called added to the reference objects that can't be resolved (lazy objects)
			// returns:
			//		An object, the result of the processing
			args = args || {};
			var idAttribute = args.idAttribute || 'id';
			var refAttribute = this.refAttribute;
			var idAsRef = args.idAsRef;
			var prefix = args.idPrefix || '';
			var assignAbsoluteIds = args.assignAbsoluteIds;
			var index = args.index || {}; // create an index if one doesn't exist
			var timeStamps = args.timeStamps;
			var resolvePathFn = args.resolvePath || resolvePath;
			var ref,
				reWalk = [];
			//var pathResolveRegex = /^(.*\/)?(\w+:\/\/)|[^\/\.]+\/\.\.\/|^.*\/(\/)/;
			var addProp = this._addProp;
			var propertyDefinition;
			var F = function() {};
			function walk(it, stop, defaultId, needsPrefix, schema, defaultObject) {
				// this walks the new graph, resolving references and making other changes
				var i, update, val,
					id = idAttribute in it ? it[idAttribute] : defaultId;
					
				if (idAttribute in it || ((id !== undefined) && needsPrefix)) {
					id = resolvePathFn(prefix + id);
				}
				var target = defaultObject || it;
				if (id !== undefined) { // if there is an id available...
					if (assignAbsoluteIds) {
						it.__id = id;
					}
					if (args.schemas && (!(it instanceof Array)) && // won't try on arrays to do prototypes, plus it messes with queries
						(val = id.match(/^(.+\/)[^\.\[]*$/))) { // if it has a direct table id (no paths)
						schema = args.schemas[val[1]];
					}
					// if the id already exists in the system, we should use the existing object, and just
					// update it... as long as the object is compatible
					if (index[id] && ((it instanceof Array) == (index[id] instanceof Array))) {
						target = index[id];
						delete target.$ref; // remove this artifact
						delete target._loadObject;
						update = true;
					} else {
						var proto = schema && schema.prototype; // and if has a prototype
						if (proto) {
							// if the schema defines a prototype, that needs to be the prototype of the object
							F.prototype = proto;
							target = new F();
						}
					}
					index[id] = target; // add the prefix, set _id, and index it
					if (timeStamps) {
						timeStamps[id] = args.time;
					}
				}
				while (schema) {
					var properties = schema.properties;
					if (properties) {
						for (i in it) {
							propertyDefinition = properties[i];
							if (propertyDefinition && propertyDefinition.format == 'date-time' && typeof it[i] == 'string') {
								it[i] = stamp.fromISOString(it[i]);
							}
						}
					}
					schema = schema["extends"];
				}
				var length = it.length;
				for (i in it) {
					if (i == length) {
						break;
					}
					if (it.hasOwnProperty(i)) {
						val = it[i];
						if ((typeof val == 'object') && val && !(val instanceof Date) && i != '__parent') {
							ref = val[refAttribute] || (idAsRef && val[idAttribute]);
							if (!ref || !val.__parent) {
								if (it != reWalk) {
									val.__parent = target;
								}
							}
							if (ref) { // a reference was found
								// make sure it is a safe reference
								delete it[i];// remove the property so it doesn't resolve to itself in the case of id.propertyName lazy values
								var path = ref.toString().replace(/(#)([^\.\[])/, '$1.$2').match(/(^([^\[]*\/)?[^#\.\[]*)#?([\.\[].*)?/); // divide along the path
								if (index[resolvePathFn(prefix + ref)]) {
									ref = index[resolvePathFn(prefix + ref)];
								} else if ( (ref = (path[1] == '$' || path[1] == 'this' || path[1] === '') ? root : index[resolvePathFn(prefix + path[1])]) ) { // a $ indicates to start with the root, otherwise start with an id
									// if there is a path, we will iterate through the path references
									if (path[3]) {
										/*jshint loopfunc:true*/
										path[3].replace(/(\[([^\]]+)\])|(\.?([^\.\[]+))/g, function(t, a, b, c, d) {
											ref = ref && ref[b ? b.replace(/[\"\'\\]/, '') : d];
										});
									}
								}
								if (ref) {
									val = ref;
								} else {
									// otherwise, no starting point was found (id not found), if stop is set, it does not exist, we have
									// unloaded reference, if stop is not set, it may be in a part of the graph not walked yet,
									// we will wait for the second loop
									if (!stop) {
										var rewalking;
										if (!rewalking) {
											reWalk.push(target); // we need to rewalk it to resolve references
										}
										rewalking = true; // we only want to add it once
										val = walk(val, false, val[refAttribute], true, propertyDefinition);
										// create a lazy loaded object
										val._loadObject = args.loader;
									}
								}
							} else {
								if (!stop) { // if we are in stop, that means we are in the second loop, and we only need to check this current one,
									// further walking may lead down circular loops
									val = walk(val, reWalk == it, id === undefined ? undefined : addProp(id, i), // the default id to use
										false, propertyDefinition,
										// if we have an existing object child, we want to
										// maintain it's identity, so we pass it as the default object
										target != it && typeof target[i] == 'object' && target[i]);
								}
							}
						}
						it[i] = val;
						if (target != it && !target.__isDirty) { // do updates if we are updating an existing object and it's not dirty
							var old = target[i];
							target[i] = val; // only update if it changed
							/*jshint laxbreak:true*/
							if (update && val !== old && // see if it is different
								!target._loadObject && // no updates if we are just lazy loading
								!(i.charAt(0) == '_' && i.charAt(1) == '_') && i != "$ref"
								&& !(val instanceof Date && old instanceof Date && val.getTime() == old.getTime()) && // make sure it isn't an identical date
								!(typeof val == 'function' && typeof old == 'function' && val.toString() == old.toString()) && // make sure it isn't an indentical function
								index.onUpdate) {
								index.onUpdate(target, i, old, val); // call the listener for each update
							}
						}
					}
				}

				if (update && (idAttribute in it || target instanceof Array)) {
					// this means we are updating with a full representation of the object, we need to remove deleted
					for (i in target) {
						if (!target.__isDirty && target.hasOwnProperty(i) && !it.hasOwnProperty(i) && !(i.charAt(0) == '_' && i.charAt(1) == '_')
							&& !(target instanceof Array && isNaN(i))) {
							if (index.onUpdate && i != "_loadObject" && i != "_idAttr") {
								index.onUpdate(target, i, target[i], undefined); // call the listener for each update
							}
							delete target[i];
							while (target instanceof Array && target.length && target[target.length - 1] === undefined) {
								// shorten the target if necessary
								target.length--;
							}
						}
					}
				} else {
					if (index.onLoad) {
						index.onLoad(target);
					}
				}
				return target;
			}
			if (root && typeof root == 'object') {
				root = walk(root, false, args.defaultId, true); // do the main walk through
				walk(reWalk, false); // re walk any parts that were not able to resolve references on the first round
			}
			return root;
		},

		fromJson : function(/*String*/str, /*Object?*/ args) {
			// summary:
			//		evaluates the passed string-form of a JSON object.
			// str:
			//		a string literal of a JSON item, for instance:
			// |	'{ "foo": [ "bar", 1, { "baz": "thud" } ] }'
			// args:
			//		See resolveJson
			// returns:
			//		An object, the result of the evaluation
			var root;
			try {
				// var root = eval('(' + str + ')'); // do the eval
				root = json.parse(str); //LZ: use json.parse instead of unsafe eval
			} catch (e) {
					throw new SyntaxError("Invalid JSON string: " + e.message + " parsing: " + str);
			}
			if (root) {
				return this.resolveJson(root, args);
			}
			return root;
		}
	});

	return ref;
});
