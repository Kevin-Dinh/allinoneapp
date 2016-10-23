define([
	"gjax/collections/indexOf",
	"./_base"
], function(indexOf, base) {

	return function(blacklist/*, dest, sources*/) {
		// summary:
		//		Use to add all except specific properties of source object(s) into destination object.
		// blacklist: Array|String
		//		Array of property names. These properties will NOT be added to `dest` from `sources`.
		//		Single property name can also be provided instead of array with 1 string.
		// dest: Object
		//		The object to which to copy/add properties contained in `sources`. If dest is falsy, then
		//		a new object is manufactured before copying/adding properties begins.
		// sources: Object...
		//		One of more objects from which to draw properties to copy into `dest`. Sources are processed
		//		left-to-right and if more than one of these objects contain the same property name, the right-most
		//		value "wins". Properties specified in `blacklist` are ignored.
		// returns: Object
		//		`dest`, as modified.
		// description:
		//		All properties, including functions (sometimes termed "methods"), excluding any non-standard extensions
		//		found in Object.prototype AND properties specified in `blacklist`, are copied/added from `sources` to `dest`. 
		//		`sources` are processed left to right.
		//		The Javascript assignment operator is used to copy/add each property; therefore, by default, blacklistMixin
		//		executes a so-called "shallow copy" and aggregate types are copied/added by reference.
		// example:
		//		Make a shallow copy of an object, while ignoring "id" property
		//	|	var copy = whitelistMixin(["id"], {}, source);
		// example:
		//		Copy in properties from multiple objects.
		//	|	var flattened = whitelistMixin(["hobby"], 
		//	|		{
		//	|			name: "Fred",
		//	|			hobby: "none"
		//	|			legs: true,
		//	|		},
		//	|		{
		//	|			name: "Barney",
		//	|			hobby: "cars"
		//	|		}
		//	|	);
		//	|
		//	|	console.log(flattened.name);			// "Barney"
		//	|	console.log(flattened.legs);			// "true"
		//	|	console.log("hobby" in flattened);		// false
		blacklist instanceof Array || (blacklist = [blacklist]);
		var filterFunction = function(propName) {
			return indexOf(blacklist, propName) === -1;
		};
		var args = Array.prototype.slice.call(arguments, 0);
		args[0] = filterFunction;
		return base.filterMixin.apply(base, args);
	};
});