define([
	"dojo/_base/lang",
	"gjax/store/Memory",
	"dojo/store/Cache"
], function(lang, Memory, dCache) {

	// module:
	//		gjax/store/Cache

	var Cache = function(masterStore, options) {
		// summary:
		//		Customized dojo/store/Cache. It automatically creates gjax Memory store for caching. Caching store uses master store's getIdentity function
		//		to obtain identity of objects, instead of relaying on its own idProperty. gjax/store/Memory must be used instead of dojo/store/Memory, 
		//		because dojo/store/Memory uses idProperty internally. Using master store's getIdentity allows caching for stores that use customized 
		//		getIdentity function, for example to support matrix ids.

		var cachingStore = new Memory();
		cachingStore.getIdentity = lang.hitch(masterStore, "getIdentity");
		return new dCache(masterStore, cachingStore, options);
	};

	return Cache;
});