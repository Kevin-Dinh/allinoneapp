define([ /*jshint expr:true */
	"dojo/_base/declare",
	"dojox/mvc/StoreRefController",
	"gjax/mvc/ModelRefController",
	"dojo/when",
	"dojo/_base/lang",
	"dojox/lang/functional",
	"dojo/json",
	"dojox/uuid/generateTimeBasedUuid"
], function(declare, StoreRefController, ModelRefController, when, lang, df, json, generateTimeBasedUuid) {

	return declare([
		StoreRefController,
		ModelRefController
	], {
		// summary:
		//		A child class of dojox/mvc/StoreRefController and gjax/mvc/ModelRefController. 
		//		Keeps a reference to Dojo Object Store (in store property).

		// updateModelFromResponse: Boolean
		//		Controller will try load model from received response.
		updateModelFromResponse : false,

		// partialUpdate: Boolean
		//		Indicates if only changed properties should be committed. 
		partialUpdate : true,

		loadModelFromData : function(data) {
			// summary:
			//		Loads data as current data model. All properties will be considered changed
			// data: Object?
			// 		Defaults to {}.
			// returns: gjax/mvc/ModelRefController

			this.inherited(arguments);
			this._changedProps = df.keys(data);
			return this;
		},

		getStore : function(/*id, options*/) {
			// summary:
			//		Retrieves an object by its identity.

			// ensures promise is returned
			return when(this.inherited(arguments));
		},

		putStore : function(/*object, options*/) {
			// summary:
			//		Load data to model after putStore is done.
			//		Handles redirects correctly.

			var resp = this.inherited(arguments);
			this.updateModelFromResponse && this._updateModelFromResponse(resp);
			return resp;
		},

		addStore : function(/*object, options*/) {
			// summary:
			//		Load data to model after addStore is done.
			//		Handles redirects correctly.

			var resp = this.inherited(arguments);
			this.updateModelFromResponse && this._updateModelFromResponse(resp);
			return resp;
		},

		removeStore : function(/*id, options*/) {
			// summary:
			//		Deletes an object by its identity. Loads empty model.
			// id: Number
			//		The identity to use to delete the object
			// options: Object
			//		The options for dojo/store/*.remove().
			// returns: Boolean
			//		Returns true if an object was removed, falsy (undefined) if no object matched the id.

			var resp = this.inherited(arguments);
			this.updateModelFromResponse && this._updateModelFromResponse(resp.then(function() {
				return null; // load empty model
			}));
			return resp;
		},

		_updateModelFromResponse : function(response) {
			// summary:
			//		When addStore/putStore is done, load data to actual model.

			when(response).then(lang.hitch(this, this.loadModelFromData));
		},

		getIdentityStore : function(/*Object*/object) {
			// summary:
			//		Retrieves the identity of an object.
			// object: Object
			//		Object to get the identity from.

			return this.store.getIdentity(object);
		},

		preCommit : function(/*Object*/object) {
			// summary:
			//		Update data from model before adding/putting into store via commitModel method.
			// object:
			//		Data that will be stored.
			// returns: Object

			return object;
		},

		resetClientCallId : function() {
			// summary:
			//		Let commit already commited object again.
			//		Used when same data should be posted repeatedly.
			this._lastCommitedObject = null;
		},

		commitModel : function(/*dojo/store/api/Store.PutDirectives?*/options) {
			// summary:
			//		Commit loaded model to store.
			//		Support partial updates, only changed properties
			//		will be put into the store. 
			// options: dojo/store/api/Store.PutDirectives?
			//		Additional metadata for storing the data.  Includes an "id" property if a specific id is to be used.
			// returns: Promise

			options || (options = {});
			var identity = this.getModelIdentity();
			// PM : do partial update only if we are doing update (we have identity)
			var object = identity != null && this.partialUpdate ? this.getChangedValue() : this.getPlainValue();
			object = this.preCommit(object);

			//----- clientCallId handling ------------
			var stringifiedObj = json.stringify(object);
			if (this._lastCommitedObject && this._lastCommitedObject == stringifiedObj) {
				options.clientCallId = this._lastClientCallId;
			} else {
				options.clientCallId = this._lastClientCallId = generateTimeBasedUuid();
			}
			this._lastCommitedObject = stringifiedObj;
			//----------------------------------------

			var storeDone;
			if (identity != null && !options.overwrite) {
				object._identity = identity; // add/put relies on object identity (TODO: relied on SchemaStore)
				storeDone = this.putStore(object, options);
			} else {
				storeDone = this.addStore(object, options);
			}
			// Send the change back to the data source after add/put on store
			return when(storeDone).then(lang.hitch(this, function(result) {

				//----- clientCallId handling ------------
				if (result && result._meta && result._meta.newClientCallId) {
					this._lastClientCallId = result._meta.newClientCallId;
				}
				//----------------------------------------

				this.commit();
				return result;
			}), lang.hitch(this, function(err) {
				//----- clientCallId handling ------------
				if (err && err.response && err.response.newClientCallId) {
					this._lastClientCallId = err.response.newClientCallId;
				}
				//----------------------------------------

				throw err;
			}));
		},

		deleteModel : function(options) {
			// summary:
			//		Remove loaded model from store.
			// options: dojo/store/api/Store.PutDirectives?
			//		Additional metadata for removing the data. 
			// returns: Promise

			options || (options = {});
			var identity = this.getModelIdentity();
			var object = this.getPlainValue();

			//----- clientCallId handling ------------
			var stringifiedObj = json.stringify(object);
			if (this._lastCommitedObject && this._lastCommitedObject == stringifiedObj) {
				options.clientCallId = this._lastClientCallId;
			} else {
				options.clientCallId = this._lastClientCallId = generateTimeBasedUuid();
			}
			this._lastCommitedObject = stringifiedObj;
			//----------------------------------------

			var storeDone = this.removeStore(identity, options);

			// Send the change back to the data source after add/put on store
			return when(storeDone).then(lang.hitch(this, function(result) {

				//----- clientCallId handling ------------
				if (result && result._meta && result._meta.newClientCallId) {
					this._lastClientCallId = result._meta.newClientCallId;
				}
				//----------------------------------------

				this.loadModelFromData({});
				return result;
			}), lang.hitch(this, function(err) {
				//----- clientCallId handling ------------
				if (err && err.response && err.response.newClientCallId) {
					this._lastClientCallId = err.response.newClientCallId;
				}
				//----------------------------------------

				throw err;
			}));
		},

		getModelIdentity : function() {
			// summary:
			//		Retrieves the store identity of currently loaded model.

			return this.getIdentityStore(this.getPlainValue());
		}
	});

});