define([
	"dojo/json",
	"dojox/encoding/digests/SHA256",
	"dojox/encoding/digests/_sha-32",
	"gjax/encoding/base64url",
	"gjax/_base/kernel",
	"gjax/error"
], function(json, sha256, sha32, base64url, gkernel, error) {

	// module:
	//		gjax/jwt

	function signSHA256(headerSegment, payloadSegment) {
		var toSign = headerSegment + "." + payloadSegment;
		return base64url.base64ToBase64url(sha256(toSign, sha32.outputTypes.Base64));
	}

	function o2a(obj) {
		return base64url.encode(json.stringify(obj));
	}

	function a2o(str) {
		try {
			return json.parse(base64url.decode(str));
		} catch (err) {
			throw error.newError(new Error(), "Cannot decode JWT segment", err, "gjax/jwt", "IllegalArgumentException");
		}
	}

	return {
		// summary:
		//		Simple JWT implemenentation.
		//		Currently supports single signature algorithm: SHA-256
		//		
		//		Inspired by: https://github.com/michaelrhanson/jwt-js/blob/master/src/jwt-token.js
		//
		//		About JWT: https://tools.ietf.org/html/draft-ietf-oauth-json-web-token

		serialize : function(payload, unsecured) {
			// summary:
			//		Serializes payload object into JWT token string.
			//		Also signes the token using SHA-256 hash.
			// payload: Object
			//		Object to use as payload, must serializable as JSON.
			// unsecured: Boolean?
			//		If true, resulting token is not signed with hash. (Last part of the token will we empty as per specs.)
			// returns:	String
			
			var header = {
				typ : "JWT",
				alg : unsecured ? "none" : "SHA-256"
			};

			var headerSegment = o2a(header);
			var payloadSegment = o2a(payload);
			var signSegment = unsecured ? "" : signSHA256(headerSegment, payloadSegment);

			return headerSegment + "." + payloadSegment + "." + signSegment;
		},

		isToken : function(/*String*/ str) {
			// summary:
			//		Can be used to determine if a string resembles JWT token.
			// description:
			//		Only basic structure and 'typ' of header are checked.
			//		JWT signature (if present) is not checked.
			// returns:	Boolean
			//		Returns true or false. Never throws any errors.
			
			var parts = str.split(".");
			if (parts.length == 3) {
				try {
					var header = a2o(parts[0]);
					if (header.typ == "JWT") {
						return true;
					}
				} catch (err) {
					return false;
				}
			}
			return false;
		},

		parse : function(/*String*/ str) {
			// summary:
			//		Parses JWT token and returns payload object.
			//		Throws errors if malformed string is used.
			// returns:	Object

			var parts = str.split(".");
			gkernel.asrt(parts.length == 3, "JWT must have three parts");

			var headerSegment = parts[0];
			var payloadSegment = parts[1];
			var signSegment = parts[2];

			// verify signature
			var header = a2o(headerSegment);
			var unsecured = header.alg == "none";
			var signCheck = unsecured ? "" : signSHA256(headerSegment, payloadSegment);
			gkernel.asrt(signCheck == signSegment, "JWT signature does not match");

			return a2o(payloadSegment);
		}

	};
});