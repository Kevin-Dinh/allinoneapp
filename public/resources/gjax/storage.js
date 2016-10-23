/**
 * Wraps dojox/storage/* 
 * Features and changes:
 *  - ensures manager and providers are initialized before use
 *  - put returns Deferred, takes no callback
 *  
 *  see http://dojotoolkit.org/api/dojox/storage/Provider for rest of API
 */

/*jshint expr:true */
define([
	"gjax/_base/kernel", // asrt
	"dojo/_base/lang",
	"dojo/_base/config",
	"dojox/storage/manager",
	"dojox/encoding/digests/_base",
	"dojo/Deferred",
	"dojox/storage/LocalStorageProvider",
//    "dojox/storage/GearsStorageProvider",
	"dojox/storage/WhatWGStorageProvider",
//    "dojox/storage/FlashStorageProvider",
	"dojox/storage/BehaviorStorageProvider",
	"dojox/storage/CookieStorageProvider",
	//
	"dojox/encoding/digests/MD5"
], function(gkernel, lang, config, manager, encBase, Deferred, LocalStorageProvider, /*GearsStorageProvider,*/WhatWGStorageProvider, /*FlashStorageProvider,*/
BehaviorStorageProvider, CookieStorageProvider) {
	// module:
	//		gjax/storage

	var provider = null;

	// Flash provider is disabled
	config = lang.mixin(config, {
		disableFlashStorage : true
	});
	// dojox.flash implementation seems to be buggy // TODO check, report/* git-qa */

	//	dojox/storage providers need to register themselves in dojox/storage/manager and
	// 	this should happen before `manager.initialize()` is called in dojox/storage/_common.
	// 	Problem is with dojo build - when using build, providers are not registred before manager gets initialized!
	//	As a solution, manager is reinicialized here when provider is requested for the first time, see `_initializeStorage`

	function _initializeStorage() {
		//	Some providers are fixed by our extensions - using them there will mess up 
		//	provider registration order - therefore we register them manually here (to be safe).
		manager._initialized = false;
		// clean registered providers and register them in correct order
		manager.currentProvider = null;
		manager.providers = [];
		manager.register("dojox.storage.LocalStorageProvider", new LocalStorageProvider()); /* git-qa */
//		if (typeof GearsStorageProvider == "function")
//			manager.register("dojox.storage.GearsStorageProvider", new GearsStorageProvider()); /* git-qa */
		manager.register("dojox.storage.WhatWGStorageProvider", new WhatWGStorageProvider()); /* git-qa */
//		manager.register("dojox.storage.FlashStorageProvider", new FlashStorageProvider()); /* git-qa */
		manager.register("dojox.storage.BehaviorStorageProvider", new BehaviorStorageProvider()); /* git-qa */
		manager.register("dojox.storage.CookieStorageProvider", new CookieStorageProvider()); /* git-qa */

		manager._initialized = false;
		manager.initialize();
	}

	function _getProvider() {
		//	This is safe way to get storage provider.
		if (!provider || !provider.isAvailable()) {
			// do full initialization to be safe
			_initializeStorage();

			gkernel.asrt(manager.isAvailable(), "dojox/storage/manager not available");
			provider = manager.getProvider();
			provider.initialize();
		}
		return provider;
	}

	function hitchProvider(functName) {
		return lang.hitch(_getProvider(), functName);
	}
	
	function md5(str) {
		return encBase.MD5(str, encBase.outputTypes.Hex);
	}

	return {
		// summary:
		//		Provides persistent client-side storage.
		// description:
		//		Cross-browser implementation of dojox/storage/Provider. 
		//
		//		It unifies HTML5 local databases with emulators for older browsers under a common API.

		setProvider : function(providerName) {
			// summary:
			//		Set provider to use by name
			// providerName: String?
			//		Provider classname. If not specified, default is used.
			//		In dojo 1.8 these ake available:
			//
			//		- LocalStorageProvider			// IE9/8, Chrome, Firefox
			//		- GearsStorageProvider			// requires Google Gears
			//		- WhatWGStorageProvider			// Firefox
			//		- BehaviorStorageProvider		// IE9/8/7
			//		- CookieStorageProvider			// IE9/8/7, Chrome, Firefox
			if (!providerName) { // set default
				provider = null;
				return true;
			}
			providerName.indexOf("dojox.storage.") === 0 || (providerName = "dojox.storage." + providerName); /* git-qa */

			// get class
			var clazz = lang.getObject(providerName);
			if (clazz) {
				// instantiate new provider object
				var p = new clazz();
				if (p.isAvailable()) {
					// init provider
					p.initialize();
					provider = p;
					return true;
				}
			}
			console.warn(providerName + " is not available for this platform");
			return false;
		},

		getCurrentProviderName : function() {
			// summary:
			//		Returns name of currently set storage provider.
			return _getProvider().declaredClass;
		},

		encodeKey : function(key) {
			// summary:
			//		Encodes key for safe usage with storage API.
			//		Result consist of base64 encoded MD5 hash, suffixed with original key with unsafe chars replaced by '-'
			// key: String
			//		Storage key to use.
			// exmaple:
			//	|	storage.encodeKey("/my_key") // -> "fe2bb7594ec6aaccd7467a6f48fd0c83--my_key"
			return md5(key) + "-" + key.replace(/[^0-9A-Za-z_\-]/g, "-"); // '_' is allowed for key
		},

		encodeNamespace : function(namespace) {
			// summary:
			//		Encodes namespace for safe usage with storage API.
			//		Result consist of base64 encoded MD5 hash, suffixed with original namespace with unsafe chars replaced by '-'
			// key: String
			//		Storage namespace to use.
			// exmaple:
			//	|	storage.encodeKey("/my_namespace") // -> "b2c7b604fcd9c36502f17e8bbeaecd2d--my-namespace"
			return md5(namespace) + "-" + namespace.replace(/[^0-9A-Za-z\-]/g, "-"); // '_' is NOT allowed for namespace
		},

		put : function(key, value, namespace) {
			// summary:
			//		Puts a key and value into this storage system.
			// key: String
			//		A string key to use when retrieving this value in the future.
			// value: Object
			//		A value to store; this can be any JavaScript type.
			// namespace: String?
			//		Optional string namespace that this value will be placed into;
			//		if left off, the value will be placed into dojox/storage/DEFAULT_NAMESPACE
			// returns: dojo/Deferred
			//		Saveing might be asynchronous, therefore deferred is returned.
			var d = new Deferred(), provider = _getProvider();

			var _resultsHandler = function(status, key, msg) {
				if (status == provider.SUCCESS) {
					d.resolve(msg);
				} else if (status == provider.FAILED) {
					d.reject(msg);
				} else {
					// status == provider.PENDING - waiting for user approval,
					// callback should be called again with SUCCESS/FAILED
				}
			};

			try {
				provider.put(key, value, _resultsHandler, namespace);
			} catch (exp) {
				d.reject(exp);
			}
			return d;
		},

		get : hitchProvider("get"),
		/*=====
		get : function(key, namespace) {
			// summary:
			//		Gets the value with the given key. Returns null if this key is
			//		not in the storage system.
			// key: String
			//		A string key to get the value of.
			// namespace: String
			//		Optional string namespace that this value will be retrieved from;
			//		if left off, the value will be retrieved from dojox/storage/DEFAULT_NAMESPACE
			// returns: Object
			//		Returns any JavaScript object type; null if the key is not present
		},
		=====*/
		remove : hitchProvider("remove"),
		/*=====
		remove : function(key, namespace) {
			// summary: 
			//		Removes the given key from this storage system.
			// key: String
			//		Key.
			// namespace: String?
			//		Namespace.
			},
		=====*/
		clear : hitchProvider("clear"),
		/*=====
		clear : function(namespace) {
			// summary:
			//		Completely clears this storage system of all of it's values and
			//		keys. If `namespace` is provided just clears the keys in that
			//		namespace.
			// namespace: String?
			//		Namespace to clear.
		},
		=====*/
		hasKey : hitchProvider("hasKey"),
		/*=====
		hasKey : function(key, namespace) {
			// summary:
			//		Determines whether the storage has the given key.
			// key: String
			//		Key.
			// namespace: String?
			//		Namespace.
			// returns: Boolean	
		},
		=====*/
		getKeys : hitchProvider("getKeys"),
		/*=====
		getKeys : function(namespace) {
			// summary:
			//		Enumerates all of the available keys in this storage system.
			// namespace: String?
			//		If `namespace` is provided lists only keys from that namespace.
			// returns: String[]
			//		Array of available keys
		},
		=====*/
		isValidKey : hitchProvider("isValidKey"),
		/*=====
		isValidKey : function(key) {
			// summary:
			//		Call this to ensure that the key given is valid.
			// key: String
			//		Key name to validate.
			// returns: Boolean
			//		True if key is valid.
		},
		=====*/
		isValidNamespace : hitchProvider("isValidNamespace"),
		/*=====
		isValidNamespace : function(namespace) {
			// summary:
			//		Call this to ensure that the namespace given is valid.
			// namespace: String
			//		Namespace name to validate.
			// returns: Boolean
			//		True if namespace is valid.
		},
		=====*/
		getMaximumSize : hitchProvider("getMaximumSize"),
		/*=====
		getMaximumSize : function() {
			// summary:
			//		The maximum storage allowed by this provider.
			// returns: Integer
			//		Returns the maximum storage size supported by this provider, in
			//		thousands of bytes (i.e., if it returns 60 then this means that 60K
			//		of storage is supported).
			//
			//		If this provider can not determine it's maximum size, then
			//		dojox/storage/SIZE_NOT_AVAILABLE is returned; 
			//		if there is no theoretical limit on the amount of storage
			//		this provider can return, then dojox/storage/SIZE_NO_LIMIT is
			//		returned.
		},
		=====*/
		isPermanent : hitchProvider("isPermanent")
	/*=====
	,isPermanent : function() {
		// summary:
		//		Returns whether this storage provider's values are persisted when this platform is shutdown.
		// returns: Boolean
		//		True if storage is permanent.
	}
	=====*/
	};
});
