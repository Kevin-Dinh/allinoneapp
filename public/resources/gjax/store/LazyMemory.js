define([
	"dojo/_base/lang",
	"dojo/store/Memory",
	"dojo/store/util/QueryResults",
	"dojo/when",
	"dojo/_base/declare",
	"dojo/Deferred"
], function(lang, Memory, QueryResults, when, declare, Deferred) {

	/*
	 * Design note: 
	 * declare() and inherited() are pain to use for extending Memory, but we did this.
	 * See inline comments numbered with []
	 */
	var lazyMemory = {
		constructor : function(options) {
			console.assert(!options.data && !options.dataFunction || options.dataFunction && typeof options.dataFunction == "function",
					"send us dataFunction, not data");
			// [1] Original constructor sets data to [], we need it empty.
			this.index = null;
			this.data = null;
		},
		_ensureData : function() {
			// quite hybrid returns data or promise with undefined resolved value, so do not rely on the value
			// in any way, whan(_ensureData) is done it is guaranteed that this.data is filled
			// ugly side effects, sorry
			if (this.data) {//loaded
				return this.data;
			}
			if (this._dataPromise && !this._dataPromise.isRejected()) {
				//load started, in progress or even done, not rejected
				return this._dataPromise;
			}
			//start loading, if was rejected, recreate
			return (this._dataPromise = this.dataFunction().then(lang.hitch(this, "setData"))); // see [1]
		},
		//just to DRY and still shorter than forEach it seems
		get : mf(),
		//removed getIdentity, it should not be async (widgets do not expect that), and it is useless
		put : mf(),
		add : mf(),
		remove : mf(),
		query : function(/*query, options*/) {
			var inherited = this.getInherited(arguments), args = arguments, _this = this, //
			origResults = new Deferred();

			var qr = QueryResults(when(this._ensureData())//
			.then(function() {
				var origQr = inherited.apply(_this, args); // returns QueryResults
				origResults.resolve(origQr);
				return origQr;
			}));

			// use total of inherited QueryResults (unaffectd by paging)
			qr.total = origResults.then(function(results) {
				return results.total;
			});

			return qr;
		},

		reset : function() {
			// summary:
			//		Resets EnumStore. Cached data are deleted and will be requested from server as soon as needed.
			//		Resets data and dataPromise, request will be send with new query.
			this._dataPromise && this._dataPromise.cancel();
			this._dataPromise = null;
			this.data = null;
		}

	// [2] setData still exists on prototype, shall not he used, but shall not do no harm 
	// cannot override setData, because then cannot call parent.setData (see http://bugs.dojotoolkit.org/ticket/16554)
	// from method not called setData (quite funny)
	};
	// each method will look like this
	function mf(/* params of orig Memory.method */) { // methodFactor==mf, [4] you think this is unnecesarry ? No ! needed for getInherited to work 
		return function() {
			// returns value or promise resolved to value of original method call
			//[3] try to do this with hitch, please ! we have failed, 
			// Memory.prototype.apply is another option  (antipatern) of course, 
			// pretending that we know how parent is implemented and how declare works (today)
			var inherited = this.getInherited(arguments), args = arguments, _this = this;
			return when(this._ensureData()).then(function() {
				return inherited.apply(_this, args);
			});
		};
	}
	return declare(Memory, lazyMemory);
});