/*global module:true */
({
	define : typeof define != "undefined" ? define : function(deps, factory) {
		module.exports = factory(require(deps[0]));
	}
}).define([
	"./base64"
], function(base64utf8) {

	// https://github.com/michaelrhanson/jwt-js/blob/master/src/jwt-token.js
	function base64urlencode(arg) {
		var s = base64utf8.encode(arg); // Standard base64 encoder
		return base64ToBase64url(s);
	}

	function base64ToBase64url(s) {
		s = s.split('=')[0]; // Remove any trailing '='s
		s = s.replace(/\+/g, '-'); // 62nd char of encoding
		s = s.replace(/\//g, '_'); // 63rd char of encoding
		return s;
	}

	function base64urldecode(arg) {
		var s = arg;
		s = s.replace(/-/g, '+'); // 62nd char of encoding
		s = s.replace(/_/g, '/'); // 63rd char of encoding
		switch (s.length % 4) // Pad with trailing '='s
		{
		case 0:
			break; // No pad chars in this case
		case 2:
			s += "==";
			break; // Two pad chars
		case 3:
			s += "=";
			break; // One pad char
		default:
			throw new Error("Illegal base64url string!");
		}
		return base64utf8.decode(s); // Standard base64 decoder
	}

	return {
		encode : base64urlencode,
		decode : base64urldecode,
		base64ToBase64url : base64ToBase64url
	};

});