define([
	"gjax/request/jsonXhr",
	"dojo/request/util",
	"dojo/_base/lang",
	"gjax/json/ref",
	"gjax/uri/Uri",
	"dojo/promise/all",
	"dojox/lang/functional",
	"dojo/Deferred",
	"dojox/lang/functional/fold"
], function(jsonXhr, util, lang, jsonRef, Uri, all, df, Deferred) {

	// summary:
	//		jsonXhr with resolving JSON references feature
	// description:
	//		Prototype oo jsonXhr with resolving JSON references feature
	//		Implementation uses dojox/json/ref internally - which provide lazy loading of the referenced objects; 
	//		this loading is explicitelly called after the json is parder

	var jsonRefXhr = function(url, options) {
		return jsonRefXhr._impl(url, options);
	};

	jsonRefXhr._impl = function(url, options) {
		var index = {};
		var dataPromise = callXhr(url, options, index);
		var dfd = new Deferred();
		dfd.response = dataPromise.response;
		dataPromise//
		.then(lang.partial(removePrivateProps, index))//
		.then(dfd.resolve, dfd.reject);
		return dfd;
	};

	function callXhr(url, options, index) {
		//if uri does not contain host, resolve it to current uri first (resolving may be done only against absolute uri)
		var base = Uri.resolve(url, ".");

		//IE breaks point 9 in http://www.w3.org/TR/XMLHttpRequest/#the-open()-method and sends fragment, so strip it here
		url = Uri.setFragment(url, null);

		options = (options || {});
		options.handleAs = "text";
		var dataPromise = jsonXhr(url, options);
		var dfd = new Deferred();
		dfd.response = dataPromise.response;

		dataPromise//
		.then(function(resultText) {
			var result = jsonRef.fromJson(resultText, {
				//absolute ids + idPrefix will allow the loader to load the object (__id= prefix+id)
				assignAbsoluteIds : true,
				idPrefix : Uri.getPath(base),
				idAttribute : options.idAttribute,
				index : index,
				//loader must be provided
				loader : lang.partial(loader, index)
			});

			return preloadRefs(result);
		})//
		.then(dfd.resolve, dfd.reject);
		return dfd;
	}

	//method responsible for loading the reference
	//methods expects that it is called on the object being loaded
	function loader(index) {
		var uri = this.__id;
		if (lang.isString(this.$ref)) {
			return callXhr(uri, null, index)//
			.then(lang.hitch(this, function(/*result*/) {
				// using value from index instead of result will ensure that referencing nested object will work (e.g. $ref:'b#c')
				lang.mixin(this, index[this.__id]);
				delete this.$ref;
				delete this._loadObject;
				return this;
			}));
		} else {
			//e.g. ref defined in draft-03/schema.json
			console.warn("$ref is not string");
			delete this._loadObject;
			return this;
		}
	}

	function preloadRefs(obj, walkedIdx) {
		walkedIdx = walkedIdx || {};
		return all(df.reduce(obj, function(promises, value, key) {
			if (key.indexOf && key.indexOf("__") === 0) {//skip internal properties
				return promises;
			} else if (key == "_loadObject") {
				promises.push(value.apply(obj));
			} else if (value && (lang.isArray(value) || lang.isObject(value)) && !(value.__id in walkedIdx)) {//prevent cycling (check for !array & object because there are arrays with props, that are evaluated as object)
				walkedIdx[value.__id] = true;
				promises.push(preloadRefs(value, walkedIdx));
			}
			return promises;
		}, [])).then(function(/*results*/) {
			return obj;
		});
	}

	function removePrivateProps(index, obj) {
		df.forIn(index, function(val) {
			delete val.__id;
			delete val.__parent;
		});
		return obj;
	}

	util.addCommonMethods(jsonRefXhr);
	return jsonRefXhr;
});