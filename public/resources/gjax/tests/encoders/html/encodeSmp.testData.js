define([], function() {
	var testData = {
		//	 TODO document structure
		"c1" : {
			range : "0x0000-0x0008,0x000B,0x000C,0x000E-0x001F",
			enc : "repl"
		},
		"xmlWhites" : {
			range : "0x0009,0x000A,0x000D,0x0020",
			enc : "raw"
		},
		"big5" : {
			range : "0x0022,0x0026,0x0027,0x003C,0x003E",
			enc : "dec"
		},
		"basicLatin" : {
			range : "0x0021,0x0023-0x0025,0x0028-0x003B,0x003D,0x003F-0x007E",
			enc : "raw"
		},
		"c2" : {
			range : "0x007F-0x009F",
			enc : "repl"
		},
		"latinSupplement" : {
			range : "0x00A0-0x00FF",
			enc : "dec"
		},
		"restOfBmp" : {
			range : "0x0100-0xD7FF,0xE000-0xFFFD",
			enc : "dec"
		},
		"surrogates" : {
			range : "0xD800–,0xDBFF][0xDC00-0xDFFF",
			enc : "repl"
		},
		"smp" : {
			range : "0x10000-1FFFD",
			enc : "decSmp"
		},
		"null" : {
			values : [
				null,
				undefined
			],
			enc : "empty"
		},
		"nonString" : {
			values : [
				123,
				true,
				false,
				NaN,
				Infinity
			],
			enc : "toString"
		}

	};
	return testData;
});