/**
 * Internal test for gjax/uri API. TODO: more tests
 */
define([
	"doh",
	"gjax/uri"
], function(doh, uri) {

	var componentsData = [ // s, a, p, q, f
		"http:",
		"http://",
		"http://host",
		"http://@host",
		"http://l@",
		"http://l@:9090",
		"http://@",
		"http:///p",
		"http://l:p@host:8080/s1/s2?q#f",
		"http://host"
	];
	var segmentsData = [
		"",
		"/",
		"/a/b",
		"/a/b/"
	];
	var encodeQueryData = [
		// test data //encoded expected value
		"abcd",
		"abcd",
		" ",
		"%20"
	];
	var removeDotSegmentsData = [
		// test data //expected value
		"/a/b/c/./../../g",
		"/a/g",
		"/.",
		"/",
		"/x/..",
		"/",
		"/x/../",
		"/",
		"/a/../../.",
		"/",
		"/./x/../b/c/d",
		"/b/c/d" // modified from 6.2.2.
	];
	var resolveData = [
		// ref //base //expected value
		"g:h",
		"http://a/b/c/d;p?q",
		"g:h",
		"g",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g",
		"./g",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g",
		"g/",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g/",
		"/g",
		"http://a/b/c/d;p?q",
		"http://a/g",
		"//g",
		"http://a/b/c/d;p?q",
		"http://g",
		"?y",
		"http://a/b/c/d;p?q",
		"http://a/b/c/d;p?y",
		"g?y",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g?y",
		"#s",
		"http://a/b/c/d;p?q",
		"http://a/b/c/d;p?q#s",
		"g#s",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g#s",
		"g?y#s",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g?y#s",
		";x",
		"http://a/b/c/d;p?q",
		"http://a/b/c/;x",
		"g;x",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g;x",
		"g;x?y#s",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g;x?y#s",
		"",
		"http://a/b/c/d;p?q",
		"http://a/b/c/d;p?q",
		".",
		"http://a/b/c/d;p?q",
		"http://a/b/c/",
		"./",
		"http://a/b/c/d;p?q",
		"http://a/b/c/",
		"..",
		"http://a/b/c/d;p?q",
		"http://a/b/",
		"../",
		"http://a/b/c/d;p?q",
		"http://a/b/",
		"../g",
		"http://a/b/c/d;p?q",
		"http://a/b/g",
		"../..",
		"http://a/b/c/d;p?q",
		"http://a/",
		"../../",
		"http://a/b/c/d;p?q",
		"http://a/",
		"../../g",
		"http://a/b/c/d;p?q",
		"http://a/g",

		// abnormal
		"../../../g",
		"http://a/b/c/d;p?q",
		"http://a/g",
		"../../../../g",
		"http://a/b/c/d;p?q",
		"http://a/g",
		"/./g",
		"http://a/b/c/d;p?q",
		"http://a/g",
		"/../g",
		"http://a/b/c/d;p?q",
		"http://a/g",
		"g.",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g.",
		".g",
		"http://a/b/c/d;p?q",
		"http://a/b/c/.g",
		"g..",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g..",
		"..g",
		"http://a/b/c/d;p?q",
		"http://a/b/c/..g",

		"./../g",
		"http://a/b/c/d;p?q",
		"http://a/b/g",
		"./g/.",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g/",
		"g/./h",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g/h",
		"g/../h",
		"http://a/b/c/d;p?q",
		"http://a/b/c/h",
		"g;x=1/./y",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g;x=1/y",
		"g;x=1/../y",
		"http://a/b/c/d;p?q",
		"http://a/b/c/y",

		"g?y/./x",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g?y/./x",
		"g?y/../x",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g?y/../x",
		"g#s/./x",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g#s/./x",
		"g#s/../x",
		"http://a/b/c/d;p?q",
		"http://a/b/c/g#s/../x",

		// if strict
		"http:g",
		"http://a/b/c/d;p?q",
		"http:g"
	];
//	var paths = [
//		"blank.html",
//		true,
//		"/aaa",
//		true,
//		"/a/b/c",
//		true,
//		"/%61/b/c",
//		true,
//		"/%a",
//		false
//	];

	var testObj = {
		decodeSegments : function() {
			var a0 = uri.decodeSegments("");
			doh.t(a0.length === 0, "empty array expected");

			var a1 = uri.decodeSegments("/");
			doh.t(a1.length === 1 && a1[0] === "", "1 void segment expected");

			var a2 = uri.decodeSegments("/a/b");
			doh.t(a2.length === 2 && a2[0] === "a" && a2[1] === "b", "2 segmentsData a,b expected");

			var a3 = uri.decodeSegments("/a/b/");
			doh.t(a3.length === 3 && a3[0] === "a" && a3[1] === "b" && a3[2] === "", "3 segmentsData a,b,void expected");
		},
		encodeSegments : function() {
			var data = [];
			var stringPath = uri.encodeSegments(data);
			doh.is("", stringPath);
			
			data = [
				"a",
				"b"
			];
			stringPath = uri.encodeSegments(data);
			doh.is("/a/b", stringPath);
			
			data = [
				"a",
				"b",
				""
			];
			stringPath = uri.encodeSegments(data);
			doh.is("/a/b/", stringPath);
		},
		removeDotSegments : function() {
			for ( var i = 0; i < removeDotSegmentsData.length; i = i + 2) {
				var original = removeDotSegmentsData[i];
				var expected = removeDotSegmentsData[i + 1];
				var res = uri.removeDotSegments(original);
				doh.is(res, expected, "expected:" + expected + ", but:" + res);
			}
		},
		resolve : function() {
			for ( var i = 0; i < resolveData.length; i = i + 3) {
				var ref = resolveData[i];
				var base = resolveData[i + 1];
				var expected = resolveData[i + 2];
				var res = uri.resolve(uri.decomposeComponents(base), uri.decomposeComponents(ref));
				var resStr = uri.recomposeComponents(res);
				doh.is(resStr, expected, "expected:" + expected + ", but:" + resStr);
			}
		},
		encodeQuery : function() {
			for ( var i = 0; i < encodeQueryData.length; i = i + 2) {
				var original = encodeQueryData[i];
				var expected = encodeQueryData[i + 1];
				var res = uri.encodeQuery(original);
				doh.is(expected, res, "expected:" + expected + ", but:" + res);
			}
		},
		segments : function() {
			for (var i = 0; i < segmentsData.length; i++) {
				var original = segmentsData[i];
				var d = uri.decodeSegments(original);
				var res = uri.encodeSegments(d);
				doh.is(original, res, "expected:" + res + ", but:" + original);
			}
		},
		components : function() {
			for (var i = 0; i < componentsData.length; i++) {
				var original = componentsData[i];
				var decomposed = uri.decomposeComponents(original);
				var recomposed = uri.recomposeComponents(decomposed);
				doh.is(original, recomposed, "expected:" + original + ", but:" + recomposed);
			}
		},
		
		"uri.query return values and types" : function() {

			doh.t(uri.decomposeComponents("/test").query === undefined, //
			"query is UNDEFINED when no question mark");

			doh.t(uri.decomposeComponents("/test?").query === "",//
			"query is EMPTY STRING when question mark but nothing after");

		}
	};

	doh.register("gjax/uri", testObj);
});