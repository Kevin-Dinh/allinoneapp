define([
	"dojo/_base/lang",
	"dojo/date/stamp",
	"gjax/_base/object",
	"gjax/_base/date",
	"gjax/uri"
], function(lang, stamp, gobject, gdate, uri) {

	// module:
	//		gjax/io-query

	var autoConverted = {
		"true" : true,
		"false" : false,
		"null" : null
	};

	var converters = {
		string : function(x) {
			return decodeURIComponent(x);
		},
		number : function(x) {
			var number = +x;
			if (isNaN(number)) {
				throw new URIError("Invalid number " + number);
			}
			return number;
		},
		date : function(x) {
			var date, isoDate = stamp.fromISOString(x);
			if (isoDate) {
				date = isoDate;
			}
			if (!date || isNaN(date) || !date.getTime || isNaN(date.getTime())) {
				throw new URIError("Invalid date " + x);
			}
			return date;

		},
		"boolean" : function(x) {
			return x === "true";
		}
	};

	var backstop = {};
	return {
		// summary:
		//		This module defines query string processing functions. 

		_insertAndConvertToIso : function(array, name, value, options) {
			// summary:
			//		Converts array of column indexes or column names to array of collumn indexes.
			//		Also converts single index or name to array of one element.
			// array: Array
			//		Array where to push value.
			// name: String
			//		Property name form json object.
			// value: various
			//		Value for assigned to property that together creates combination prop=value.
			// options: Object?
			//		dojo/date/stamp options that can specify if we want to covert date, time or both if undefined.
			// tags:
			//		private
			var retVal;
			var selector, stampOptions = options && options[name];
			if (gdate.isDate(value)) {
				if (!stampOptions) {
					selector = {
						selector : "date"
					};
				} else if (stampOptions == "date" || stampOptions == "time") {
					selector = {
						selector : stampOptions
					};
				} else {
					selector = stampOptions;
				}
				retVal = stamp.toISOString(value, selector);
			} else {
				retVal = value;
			}
			retVal = uri.encodeQuery("" + retVal);
			// encode also "(" and ")" and "="
			retVal = retVal.replace(/([()=&])/g, function(m, c) {
				return "%" + (c.charCodeAt(0)).toString(16).toUpperCase();
			});
			retVal = uri.encodeQuery("" + name) + "=" + retVal;
			array.push(retVal);
		},

		objectToQuery : function objectToQuery(/*Object*/map, /*Object?*/stampOptions) {
			// summary:
			//		takes a name/value mapping object and returns a string representing
			//		a URL-encoded version of that object.
			//
			// extends:
			//		dojo/io-query with functionality to remove "", null, undefined, NaN values and converts Date object to ISO format
			//
			// returns:
			//		query string such as "blah=blah&multi=thud&multi=thonk"
			//
			// example:
			//		this object:
			//
			//	|	{
			//	|		blah: "blah",
			//	|		multi: [
			//	|			"thud",
			//	|			"thonk"
			//	|		]
			//	|	};
			//
			//		yields the following query string:
			//
			//	|	"blah=blah&multi=thud&multi=thonk"

			// FIXME: need to implement encodeAscii!! //this part was originally taken from dojo/io-query
			var pairs = [];

			//remove "", null, undefined, NaN, "__all" properties
			map = gobject.filter(map, [
				"",
				null,
				undefined,
				NaN,
				{},
				"__all"
			]); //__all is special property that will be removed from all queries

			for ( var name in map) {
				var value = map[name];
				if (value != backstop[name]) {
					/*jshint expr:true */
					lang.isArray(value) || (value = [
						value
					]);
					for ( var i = 0, l = value.length; i < l; ++i) {
						this._insertAndConvertToIso(pairs, name, value[i], stampOptions);
					}
				}
			}
			return pairs.join("&"); // String
		},

		queryToObject : function queryToObject(/*String*/str) {
			// summary:
			//		Create an object representing a de-serialized query section of a
			//		URL. Query keys with multiple values are returned in an array.
			//
			// extends:
			//		dojo/io-query with functionality to convert ISO dates into Date object
			//
			// returns:
			//		JSON object
			//
			// example:
			//		This string:
			//
			//	|		"foo=bar&foo=baz&thinger=%20spaces%20=blah&zonk=blarg&"
			//
			//		results in this object structure:
			//
			//	|		{
			//	|			foo: [ "bar", "baz" ],
			//	|			thinger: " spaces =blah",
			//	|			zonk: "blarg"
			//	|		}
			//
			//		Note that spaces and other urlencoded entities are correctly
			//		handled.

			// FIXME: should we grab the URL string if we're not passed one?
			var dec = decodeURIComponent, qp = str.split("&"), j, ret = {}, name, val, type;
			for ( var i = 0, l = qp.length, item; i < l; ++i) {
				item = qp[i];
				if (item.length) {
					var s = item.indexOf("=");
					if (s < 0) {
						name = dec(item);
						val = "";
					} else {
						name = dec(item.slice(0, s));
						val = dec(item.slice(s + 1));
					}
					if (typeof ret[name] == "string") { // inline'd type check
						ret[name] = [
							ret[name]
						];
					}

					j = val.indexOf(":");
					if (val in autoConverted) {
						val = autoConverted[val];
					} else if (j >= 0) { // already decoded
						type = val.slice(0, j);
						if (type in converters) {
							val = converters[type](val.slice(j + 1));
						}
					} else {
						// TODO: rewrite, use converters
						//try conversion from ISO to date
						val = (lang.trim(val).length > 0) ? ((isISOString(val) && stamp.fromISOString(val)) || val) : val;
					}

					if (lang.isArray(ret[name])) {
						ret[name].push(val);
					} else {
						ret[name] = val;
					}
				}
			}
			return ret; // Object
		}
	};

	function isISOString(str) {
		// ISO str with required full date part - to prevent yearlike numbers (e.g. 1234) to be converted to date
		return typeof str == "string" && ~str.search(/^\d{4}-\d{2}-\d{2}(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+\-](\d{2}):(\d{2}))|Z)?)?$/);
	}
});