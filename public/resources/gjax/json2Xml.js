/*
 * This work is licensed under Creative Commons GNU LGPL License.
 * 
 * License: http://creativecommons.org/licenses/LGPL/2.1/ Version: 0.9
 * Author: Stefan Goessner/2006 Web: http://goessner.net/
 * 
 * Additions: mhlavac@gratex.com, review: marcus@gratex.com
 * See git history for xml2json
 */
define([
	"gjax/encoders/html/encodeSmp",
	"dojo/json"
], function(enc, json) {

	function isDate(d) {
		// from gjax.v4
		return (d != null && !isNaN(d) && Object.prototype.call(d) === "[object Date]");
	}
	function unquote(str) {
		// TODO: refactor, extract
		return str.replace(/^"([\S\s]*)"$/g, "$1");
	}
	var defaultConverters = [
		{
			// date converter
			"isApplicable" : isDate,
			"convert" : function(date) {
				var isoString = json.stringify(date);
				return unquote(isoString);
			}
		}
	];
	var _toXml = function(v, name, converters) {
		/*jshint maxcomplexity:50 */// ported from xml2json
		var r = [], tagName = enc(name);
		if (v instanceof Array) {
			for ( var i = 0, n = v.length; i < n; i++) {
				r.push(_toXml(v[i], name, converters));
			}
		} else if (typeof v == "object") {
			var hasChild = false, m;
			r.push("<" + tagName);
			for (m in v) {
				if (m.charAt(0) == "@") {
					r.push(" " + enc(m.substr(1)) + "=\"" + enc(v[m].toString()) + "\"");
				} else {
					hasChild = true;
				}
			}
			r.push(hasChild ? ">" : "/>");
			if (hasChild) {
				for (m in v) {
					var vm = v[m];
					if (m == "#text") {
						r.push(enc(vm));
					} else if (m == "#cdata") {
						r.push("<![CDATA[" + enc(vm) + "]]>");
					} else if (m.charAt(0) != "@") {
						var c, converted = false;
						for (c in converters) {
							var cnv = converters[c];
							if (cnv.isApplicable(vm)) {
								r.push(_toXml(cnv.convert(vm), m, converters));
								converted = true;
								break;
							}
						}
						if (!converted) {
							r.push(_toXml(vm, m, converters));							
						}
					}
				}
				r.push("</" + tagName + ">");
			}
		} else {
			if (typeof v != "undefined") {
				r.push("<" + tagName + ">" + enc(v.toString()) + "</" + tagName + ">");
			}
		}
		return r.join("");
	};
	/**
	 * in comparison of original implementation: 
	 * - removed indentation support 
	 * - added XML encoding of keys and values
	 * - ignores undefined values
	 * 
	 * @param {Object}
	 *            o object to serialize
	 * @param {array}
	 *            converters custom converters. format: [ {//sample converter
	 *            "isApplicable": function returning expression if is the
	 *            converter applicable "convert": function returning serislized
	 *            object ito string } ]
	 * @return {string} string that represents object serialized to xml
	 */
	function json2xml2(o, converters) {
		/*jshint expr:true */
		converters || (converters = defaultConverters);
		var r = [], m;
		for (m in o) {
			r.push(_toXml(o[m], m));
		}
		return r.join("");
	}
	return {
		toXml : json2xml2
	};
});
