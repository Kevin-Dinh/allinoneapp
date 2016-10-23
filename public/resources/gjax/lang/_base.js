/**
 * TODO: fix based on dojo bug report decisions:
 * http://bugs.dojotoolkit.org/ticket/15478
 */
define([
	"dojo/has"
], function(has) {

	var _extraNames = has("bug-for-in-skips-shadowed") ? "hasOwnProperty.valueOf.isPrototypeOf.propertyIsEnumerable.toLocaleString.toString.constructor".split(".") : [],

	_extraLen = _extraNames.length;

	return {
		_mixin : function(filterFunction, dest, source, copyFunc) {
			// filterFunction shall return true to include the property
			// copied from dojo lang with quick continue escapes //TODO: rewrite iterations and full testcase
			var name, s, i, empty = {};
			for (name in source) {
				if (!filterFunction(name, source, dest)) {
					continue;
				}
				// the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
				// inherited from Object.prototype.	 For example, if dest has a custom toString() method,
				// don't overwrite it with the toString() method that source inherited from Object.prototype
				s = source[name];
				if (!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))) {
					dest[name] = copyFunc ? copyFunc(s, name) : s;
				}
			}
			if (has("bug-for-in-skips-shadowed")) {
				if (source) {
					for (i = 0; i < _extraLen; ++i) {
						name = _extraNames[i];
						s = source[name];
						if (!filterFunction(name, source)) {
							continue;
						}
						if (!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))) {
							dest[name] = copyFunc ? copyFunc(s, name) : s;
						}
					}
				}
			}
			return dest; // Object
		},
		filterMixin : function(filterFunction, dest/*, sources*/) {
			if (!dest) {
				dest = {};
			}
			for ( var i = 2, l = arguments.length; i < l; i++) {
				this._mixin(filterFunction, dest, arguments[i]);
			}
			return dest; // Object
		}
	};
});