define([
	"dojo/_base/declare",
	"dojo/store/Memory",
	"dojo/_base/lang",
	"gjax/error",
	"gjax/store/RqlQueryEngine"
], function(declare, Memory, lang, error, RqlQueryEngine) {

	// module:
	//		gjax/store/Memory

	return declare(Memory, {

		queryEngine : RqlQueryEngine,

		// returnObjectOnAddPut: Boolean
		//		When false, dojo/store/api/Store API is honoured - i.e. add and put methods return id id added/updated object.
		//		When true, add and put methods return added/updated object instead of id.
		//		Use true if you need simmilar API to current JsonRest and SchemaStore implementations.
		returnObjectOnAddPut : false,

		// putCanAdd: Boolean
		//		When false, new item can be inserted via put method (like in dojo/store/Memory).
		//		When true this causes error.
		strictPut : false,

		// summary:
		//		Extended dojo/store/Memory that always uses getIdentity instead of accessing idProperty directly. It allows using modified getIdentity,
		//		for example to support matrixIds.

		_generateIdentity : function(object, options) {
			// summary:
			//		Generates id for newly added object.
			// description:
			//		This method exists to allow easy overriding of id creation and assignment.
			//		
			//		Default implementation uses Math.random() to create unique numeric id.
			//		ID is set to object using `this.idProperty` value as key.
			//
			//		Any custom implementation shoulb be consistent with getIdentity implementation.
			// returns: Object
			//		Object containing just the identity property(ies).
			// tags:
			//		protected
			var identity = {};
			identity[this.idProperty] = (options && "id" in options) ? options.id : Math.random();
			return identity;
		},

		add : function(object, options) {
			// summary:
			//		Creates an object.
			// object: Object
			//		The object to add.
			//		Will fail if an object with the same identity is already present in store.
			// options: dojo/store/api/Store.PutDirectives?
			//		Additional metadata for storing the data. Includes an "id"
			//		property if a specific id is to be used. Id will be generated otherwise.
			// returns: Number|Object
			//		Returns newly created id or original object (see returnObjectOnAddPut docs)

			object = lang.mixin(object, this._generateIdentity(object, options));

			var data = this.data, index = this.index;
			var id = this.getIdentity(object);

			if (id in index) {
				// object exists
				throw error.newError(new Error(), "Object already exists with id " + id, //
				null, "gjax/store/Memory", "IllegalStateException");
			} else {
				// add the new object
				index[id] = data.push(object) - 1;
			}
			return this.returnObjectOnAddPut ? this.get(id) : id;
		},

		put : function(object, options) {
			// summary:
			//		Stores an object
			// object: Object
			//		The object to update.
			//		Will fail if object with the same identity is not yet present in store.
			// options: dojo/store/api/Store.PutDirectives?
			//		Additional metadata for storing the data. Includes an "id"
			//		property if a specific id is to be used.
			// returns: Number|Object
			//		Returns newly created id or original object (see returnObjectOnAddPut docs)
			var data = this.data, index = this.index;
			var id = (options && "id" in options) ? options.id : this.getIdentity(object);
			if (id in index) {
				// mix the entry to the existing
				lang.mixin(data[index[id]], object);
			} else {
				if (this.strictPut) {
					if (id == null) {
						throw error.newError(new Error(), "Cannot call put without identity", //
						null, "gjax/store/Memory", "IllegalStateException");
					} else {
						// object does not exist
						throw error.newError(new Error(), "Object does not exist with id " + id, //
						null, "gjax/store/Memory", "IllegalStateException");
					}
				} else {
					// use add
					options || (options = {});
					id == null || (options.id = id);
					return this.add(object, options);
				}
			}
			return this.returnObjectOnAddPut ? this.get(id) : id;
		},

		setData : function(data) {
			// summary:
			//		Sets the given data as the source for this store, and indexes it
			// data: Object[]
			//		An array of objects to use as the source of data.
			this.data = data;
			this.index = {};
			for ( var i = 0, l = data.length; i < l; i++) {
				this.index[this.getIdentity(data[i])] = i;
			}
		}
	});
});