var profile = (function() {
	var testResourceRe = /^gjax\/tests\//;

	var COPY_ONLY_LIST = [
		"gjax/gjax.profile",
		"gjax/package.json"
	];
	if (require.has("host-rhino")) {
		// if we are running on rhino, we have closure compiler, which breaks shCore
		COPY_ONLY_LIST.push("gjax/syntax/highlighter/shCore");

		// uglify compiler (running in node) does not cause any problems
		// so do not mark 'copy only' to prevent build errors (which still occures with closure)
		// (if shCore is built with closure, there are no build errors, but sh does not work in runtime)
	}

	var copyOnly = function(filename, mid) {
		return (COPY_ONLY_LIST.indexOf(mid) > -1) || !(/js$/.test(filename) || /css$/.test(filename));
	};

	var notAmdList = [
		"gjax/testing/findWidget"
	];

	var ignorePatternList = [
		"gjax/build"
	];

	return {
		resourceTags : {
			test: function(filename, mid){
				return testResourceRe.test(mid);
			},
			
			copyOnly : function(filename, mid) {
				return copyOnly(filename, mid);
			},

			ignore : function(filename, mid) {
				for (var i = 0, l = ignorePatternList.length; i < l; i++) {
					if (mid.indexOf(ignorePatternList[i]) > -1) {
						return true;
					}
				}
				return false;
			},

			amd : function(filename, mid) {
				if (notAmdList.indexOf(mid) > -1) {
					return false;
				}
				return /js$/.test(filename) && !copyOnly(filename, mid);
			}
		}
	};
})();
