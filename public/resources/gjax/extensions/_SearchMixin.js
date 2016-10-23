define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dijit/form/_SearchMixin",
	"dojo/string",
	"dojo/when",
	"gjax/log/level"
], function(declare, lang, _SearchMixin, string, when, level) {
	level("debug", "gjax/extensions")
			&& console.debug("GJAX EXTEND: _SearchMixin now has queryFunc method which allows you to build custom query string instead of object");
	level("debug", "gjax/extensions")
			&& console.debug("GJAX EXTEND: _SearchMixin now doesn't use searchDelay when user clicks drop down arrow or presses down arrow.");

	return _SearchMixin.extend({
		minSearchLength : 0, //number of characters when search will start
		allowEmptySearch : true,

		//MR: user overridable method
		//you can return object or string that will be passed as a value into store's query method
		//if you need to change obj[searchAttr] this will not work correctly and popup might not be displayed
		//for this cases, please use _patternToRegExp method instead.
		queryFunc : function(query/*, islikeOperator*/) {
			return query;
		},

		_startSearch : function(/*String*/text, /*Boolean*/searchImmediately) {
			// summary:
			//		Starts a search for elements matching text (text=="" means to return all items),
			//		and calls onSearch(...) when the search completes, to display the results.

			//MR:
			if (text.length === 0 && !this.allowEmptySearch) {
				return;
			}
			if (text.length > 0 && text.length < this.minSearchLength) {
				return;
			}

			this._abortQuery();
			var _this = this,
			// Setup parameters to be passed to store.query().
			// Create a new query to prevent accidentally querying for a hidden
			// value from FilteringSelect's keyField
			query = lang.clone(this.query), // #5970
			options = {
				start : 0,
				count : this.pageSize,
				queryOptions : { // remove for 2.0
					ignoreCase : this.ignoreCase,
					deep : true
				}
			}, qs = string.substitute(this.queryExpr, [
				text.replace(/([\\\*\?])/g, "\\$1")
			]), q, startQuery = function() {
				//MR: added calling queryFunc to be able to affect how query will looks like 
				var resPromise = _this._fetchHandle = _this.store.query(_this.queryFunc(query, true), options);
				if (_this.disabled || _this.readOnly || (q !== _this._lastQuery)) {
					return;
				} // avoid getting unwanted notify
				when(resPromise, function(res) {
					_this._fetchHandle = null;
					if (!_this.disabled && !_this.readOnly && (q === _this._lastQuery)) { // avoid getting unwanted notify
						when(resPromise.total, function(total) {
							res.total = total;
							var pageSize = _this.pageSize;
							if (isNaN(pageSize) || pageSize > res.total) {
								pageSize = res.total;
							}
							// Setup method to fetching the next page of results
							res.nextPage = function(direction) {
								//	tell callback the direction of the paging so the screen
								//	reader knows which menu option to shout

								// JU: adjust result length if _blank is present
								// blank item can be only as first or last item
								var resLen = res.length - ((res[0]._blank || res[res.length - 1]._blank) ? 1 : 0);

								options.direction = direction = direction !== false;
								options.count = pageSize;
								if (direction) {
									options.start += resLen;
									if (options.start >= res.total) {
										options.count = 0;
									}
								} else {
									options.start -= pageSize;
									if (options.start < 0) {
										options.count = Math.max(pageSize + options.start, 0);
										options.start = 0;
									}
								}
								if (options.count <= 0) {
									res.length = 0;
									_this.onSearch(res, query, options);
								} else {
									startQuery();
								}
							};
							_this.onSearch(res, query, options);
						});
					}
				}, function(err) {
					_this._fetchHandle = null;
					if (!_this._cancelingQuery) { // don't treat canceled query as an error
						//console.error(_this.declaredClass + ' ' + err.toString());
						//MR: display message for user
						_this.errorHandler(err);
					}
				});
			};

			lang.mixin(options, this.fetchProperties);

			// Generate query
			if (this.store._oldAPI) {
				// remove this branch for 2.0
				q = qs;
			} else {
				// Query on searchAttr is a regex for benefit of dojo/store/Memory,
				// but with a toString() method to help dojo/store/JsonRest.
				// Search string like "Co*" converted to regex like /^Co.*$/i.
				q = this._patternToRegExp(qs);
				q.toString = function() {
					return qs;
				};
			}

			// set _lastQuery, *then* start the timeout
			// otherwise, if the user types and the last query returns before the timeout,
			// _lastQuery won't be set and their input gets rewritten
			this._lastQuery = query[this.searchAttr] = q;
			this._queryDeferHandle = this.defer(startQuery, searchImmediately ? 0 : this.searchDelay);
		},
		errorHandler : function(err) {
			if (err.dojoType == "cancel") { //ignore cancel errors (as in the rest of applications)
				return;
			}
			this.focus();
			this._set("state", "Error");
			this.set("message", err.toString());
		}
	});
});