define([
	"doh",
	"dojo/_base/lang",
	"./encodeSmp.testData",
	"dojox/lang/functional/object",
	"gjax/encoders/_codePoint", // this is not tested here 
	//tested libraries
	"gjax/encoders/html/encodeSmp"
//	"gjax/encoders/html/encodeEntity",
//	"gjax/encoders/html/decodeEntity"
], function(doh, lang, testData, fobject, _codePoint, encHtml) {

	var encoders = {
		repl : function() {
			return "&#xFFFD;";
		},
		raw : function(ch) {
			return ch;
		},
		dec : function(ch) {
			return "&#" + ch.charCodeAt(0) + ";";
		},
		decSmp : function(ch) {
			return "&#" + _codePoint.to(ch.charCodeAt(0), ch.charCodeAt(1)) + ";";
		},
		empty : function() {
			return "";
		},
		toString : function(v) {
			return "" + v;
		}
	};
	
	function getChars(str) {
		var chars = [];
		var ranges = str.split(",");
		for (var i=0; i < ranges.length;i++) {
			var r = ranges[i].split("-");
			if (r.length == 2) {
				for (var j= parseInt(r[0], 16); j <= parseInt(r[1], 16) ;j++) {
					chars.push(_codePoint.from(j));					
				}
			} else {
				chars.push(_codePoint.from(parseInt(r[0], 16)));
			}
		}
		return chars;
	}

	function doTest(data) {
		var chars = data.range ? getChars(data.range) : data.values;
		var testEnc = encoders[data.enc];
		for (var i=0; i < chars.length;i++) {
			var result = encHtml(chars[i]);
			var expected = testEnc(chars[i]);
			doh.is(expected, result, "Wrong encoding of " + chars[i]);
		}
	}

	var encodeSmpTest = fobject.mapIn(testData, function(data) {
		return lang.partial(doTest, data);
	});

	doh.register("gjax/encoders/html/encodeSmp", encodeSmpTest);
});
