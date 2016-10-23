require([
	"gjax/uri",
	"gjax/encoders/_codePoint",
	"dojo/_base/array",
	"dojox/lang/functional",
	"dojo/json"
], function(uri, _codePoint, darray, df, json) {

	var fromCodePoint = _codePoint.from; //just nicer name	

	var encoders = {
		"encodeURI" : function(v) {
			try {
				return encodeURI(v);
			} catch (ex) {
				return ex;
			}
		},
		"encodeURIComponent" : function(v) {
			try {
				return encodeURIComponent(v);
			} catch (ex) {
				return ex;
			}
		},

		"uri.encodeSegment" : uri.encodeSegment,
		"uri.encodeQuery" : uri.encodeQuery,
		"uri.encodeFragment" : uri.encodeFragment
	};

	var chars = {};
	for ( var i = 0; i <= 256; i++) {
		chars[i + ""] = fromCodePoint(i);
	}
	chars[382] = fromCodePoint(382);
	chars[9216] = fromCodePoint(9216);
	chars[65824] = fromCodePoint(65824);

	//refactoring step #2
	var encoded = df.mapIn(chars, function(character, codePoint) {
		return df.forIn(encoders, "encode,property->this[property] = encode(this._character)", {
			_codePoint : codePoint,
			_character : character
		});
	});

	//console.log(encoded);
	var diff = df.filterIn(encoded, function(encodedObject) {
		var interestingOnly = df.filterIn(encodedObject, "o,key -> !!key.indexOf('_')" /* non private */);
		return !df.values(interestingOnly).every(function /*same as previous */(item, i, array) {
			return i === 0 || item === array[i - 1];
		});
	});
	var print = diff;
	console.log(json.stringify(print, null, "\t"));

});