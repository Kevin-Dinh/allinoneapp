define([
	"dojo/_base/lang",
	"gjax/_base/object", //gjax nested mixin
	"dojo/_base/declare",
	"dgrid/_StoreMixin",
	"gjax/lang/blacklistMixin",
	"dojo/_base/Deferred", /* git-qa *///dgrid code, do not change to dojo/Deferred
	"dojo/string",
	"dojo/i18n!../nls/common",
	"dojo/on",
	"put-selector/put",
	"gjax/error",
	"dojo/dom-construct",
	"dojox/uuid/generateTimeBasedUuid",
	"dojo/json",
	"gjax/log/level"
], function(lang, gObject, declare, _StoreMixin, blacklistMixin, Deferred, string, i18n, listen, put, error, domConstruct, generateTimeBasedUuid, json, level) {

	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: added support for updating nested properties for dgrid");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: added default loading and no data message for dgrid");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: added error handling for dgrid");
	level("debug", "gjax/extensions") && console.debug("GJAX FIX: dirty will not be ignored after save error");
	
	_StoreMixin.emitError = function(err) {
		// called by _trackError in context of list/grid, if an error is encountered

		//AR: do not emit errors for destroyed grids
		if (this._destroyed) {
			return;
		}

		if (typeof err !== "object") {
			// Ensure we actually have an error object, so we can attach a reference.
			err = new Error(err);
		} else if (err.dojoType === "cancel") {
			// Don't fire dgrid-error events for errors due to canceled requests
			// (unfortunately, the Deferred instrumentation will still log them)
			return;
		}
		// TO_DOJO_DO: remove this @ 1.0 (prefer grid property directly on event object)
		err.grid = this;

		if (listen.emit(this.domNode, "dgrid-error", {
			grid : this,
			error : err,
			cancelable : true,
			bubbles : true
		})) {
			console.error(err);

			//MR: display message inside grid and show error dialog
			var messageBuilder = this.errorMessage, errorDialog = this.errorDialog, message;

			//message builder can be function or string
			if (messageBuilder) {
				message = typeof messageBuilder === "function" ? messageBuilder(err) : messageBuilder;
			}
			if (message) {
				if (this.noDataNode) {
					put(this.noDataNode, "!");
					delete this.noDataNode;
				}
				this.noDataNode = put("div.dgrid-error");
				domConstruct.place(this.noDataNode, this.contentNode, "first");
				this.noDataNode.innerHTML = message; /* git-qa *///error message may be HTML
			}
			if (errorDialog) {
				errorDialog(err);
			} else {
				error._logError(err);//errorDialog would also log the error, so log it explicitelly in this case
			}
		}
	};

	lang.extend(_StoreMixin, {
		emitError : _StoreMixin.emitError,
		errorMessage : function(err) {
			return err.message;
		},
		errorDialog : error.errbackDialog,

		loadingMessage : string.substitute("<span class='dgridLoading'>${loadingMessage}</span>", {
			loadingMessage : i18n.loadingMessage
		}),

		noDataMessage : string.substitute("<span class='dgridNoData'>${noDataMessage}</span>", {
			noDataMessage : i18n.noDataMessage
		}),

		_getDataForPutter : function(id) {
			// PM extract data getter, default is data from row by Id
			// i.e. if row with given id is not rendered, get is performed (with partial update we need only identity)
			return this.row(id).data;
		},
		
		save : function() {
			// Keep track of the store and puts
			var self = this, store = this.store, dirty = this.dirty, dfd = new Deferred(), promise = dfd.promise, getFunc = function(id) {
				// returns a function to pass as a step in the promise chain,
				// with the id variable closured
				var data;
				return (self.getBeforePut || !(data = self._getDataForPutter.call(self, id))) ? function() {
					return store.get(id);
				} : function() {
					return data;
				};
			};

			// function called within loop to generate a function for putting an item
			function putter(id, dirtyObj) {
				// Return a function handler
				return function(object) {
					var colsWithSet = self._columnsWithSet, updating = self._updating, key, data, putDone, identity = store.getIdentity(object);
					// Copy dirty props to the original, applying setters if applicable					
					gObject.nestedMixin(object, dirtyObj);

					// Apply any set methods in column definitions.
					// Note that while in the most common cases column.set is intended
					// to return transformed data for the key in question, it is also
					// possible to directly modify the object to be saved.
					for (key in colsWithSet) {
						data = colsWithSet[key].set(object);
						if (data !== undefined) {
							object[key] = data;
						}
						//AR: apply set also to dirty obj
						if (lang.getObject(key, false, dirtyObj) !== undefined) {
							var newDirtyObj = colsWithSet[key].set(dirtyObj);
							if (newDirtyObj !== undefined) {
								dirtyObj = newDirtyObj;
							}
						}
					}

					var options = {
						clientCallId : dirtyObj._lastClientCallId
					};
					if (self.partialUpdate) {
						options.id = identity;
					}

					updating[id] = true;
					// Put it in the store, returning the result/promise
					putDone = self.partialUpdate ? store.put(dirtyObj, options) : store.put(object, options);
					return Deferred.when(putDone, function(result) {
						// Clear the item now that it's been confirmed updated
						delete dirty[id];
						delete updating[id];
						// return result on partial update operation
						if (self.partialUpdate) {
							return result; // TODO: emit event instead of returning
						}
					}, function(err) {
						delete updating[id]; // JU: clear updating - we don't want it to remain when (even unsuccessful) save is done
						if (err && err.response && err.response.newClientCallId) {
							// set new client call id
							dirtyObj._lastClientCallId = err.response.newClientCallId;
						}
						throw err;
					});
				};
			}

			// For every dirty item, grab the ID
			for ( var id in dirty) {
				var currentDirty = blacklistMixin([
					"_lastClientCallId",
					"_lastCommitedObject"
				], {}, dirty[id]);
				var stringifiedObj = json.stringify(currentDirty);
				// create clientCallIds if not defined
				if (!dirty[id]._lastCommitedObject || dirty[id]._lastCommitedObject != stringifiedObj) {
					dirty[id]._lastClientCallId = generateTimeBasedUuid();
					dirty[id]._lastCommitedObject = stringifiedObj;
				}

				// Create put function to handle the saving of the the item
				var put = putter(id, dirty[id]);

				// Add this item onto the promise chain,
				// getting the item from the store first if desired.
				promise = promise.then(getFunc(id)).then(put);
			}

			// Kick off and return the promise representing all applicable get/put ops.
			// If the success callback is fired, all operations succeeded; otherwise,
			// save will stop at the first error it encounters.
			dfd.resolve();
			return promise;
		}
	});
});