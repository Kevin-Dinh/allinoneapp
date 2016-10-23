/*global module:true */
({
	define : typeof define != "undefined" ? define : function(deps, factory) {
		module.exports = factory();
	}
}).define([], function() {

	var p = "=";
	var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

	var encode = function(/* string */ba) {
		// summary:
		//		Encode string as a base64-encoded string

		ba = unescape(encodeURIComponent(ba));
		if (typeof window != "undefined" && window.btoa) {
			return window.btoa(ba);
		} else {
			var s = [], l = ba.length;
			var rm = l % 3;
			var x = l - rm;
			for (var i = 0; i < x;) {
				var t = ba.charCodeAt(i++) << 16 | ba.charCodeAt(i++) << 8 | ba.charCodeAt(i++);
				s.push(tab.charAt((t >>> 18) & 0x3f), tab.charAt((t >>> 12) & 0x3f), tab.charAt((t >>> 6) & 0x3f), tab.charAt(t & 0x3f));
			}
			//	deal with trailers, based on patch from Peter Wood.
			var t2;
			switch (rm) {
			case 2:
				t2 = ba.charCodeAt(i++) << 16 | ba.charCodeAt(i++) << 8;
				s.push(tab.charAt((t2 >>> 18) & 0x3f), tab.charAt((t2 >>> 12) & 0x3f), tab.charAt((t2 >>> 6) & 0x3f), p);
				break;
			case 1:
				t2 = ba.charCodeAt(i++) << 16;
				s.push(tab.charAt((t2 >>> 18) & 0x3f), tab.charAt((t2 >>> 12) & 0x3f), p, p);
				break;
			}
			return s.join(""); //	string
		}
	};

	var decode = function(/* string */str) {
		// summary:
		//		Decode a base64-encoded string
		var out = "";
		if (typeof window != "undefined" && window.atob) {
			out = window.atob(str);
		} else {
			var s = str.split("");
			var l = s.length;
			while (s[--l] == p) {
			} //	strip off trailing padding
			for (var i = 0; i < l;) {
				var t = tab.indexOf(s[i++]) << 18;
				if (i <= l) {
					t |= tab.indexOf(s[i++]) << 12;
				}
				if (i <= l) {
					t |= tab.indexOf(s[i++]) << 6;
				}
				if (i <= l) {
					t |= tab.indexOf(s[i++]);
				}
				out = [
					out,
					String.fromCharCode((t >>> 16) & 0xff),
					String.fromCharCode((t >>> 8) & 0xff),
					String.fromCharCode(t & 0xff)
				].join("");
			}
			//	strip off any null bytes
			while (out.charCodeAt(out.length - 1) === 0) {
				out = out.substring(0, out.length - 1);
			}
		}

		out = decodeURIComponent(escape(out));

		return out; //	byte[]
	};

	return {
		encode : encode,
		decode : decode
	};
});
