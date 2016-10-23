define([
	"gjax/collections/indexOf",
	"./_base"
], function(indexOf, base) {

	var whitelistMixin = function(whitelist/*, dest, sources*/) {
		// summary:
		//		Use to add only specific properties of source object(s) into destination object.
		// whitelist: Array|String
		//		Array of property names. Only these properties will be added to `dest` from `sources`.
		//		Single property name can also be provided instead of array with 1 string.
		// dest: Object
		//		The object to which to copy/add properties contained in `sources`. If dest is falsy, then
		//		a new object is manufactured before copying/adding properties begins.
		// sources: Object...
		//		One of more objects from which to draw properties to copy into `dest`. Sources are processed
		//		left-to-right and if more than one of these objects contain the same property name, the right-most
		//		value "wins". Only properties specified in `whitelist` are copied.
		// returns: Object
		//		`dest`, as modified.
		// description:
		//		Properties specified by `whitelist` are copied/added from `sources` to `dest`. `sources` are processed left to right.
		//		The Javascript assignment operator is used to copy/add each property; therefore, by default, whitelistMixin
		//		executes a so-called "shallow copy" and aggregate types are copied/added by reference.
		// example:
		//		Make a shallow copy of an object, with only 'name' and 'age' properties
		//	|	var copy = whitelistMixin(["name", "age"], {}, source);
		// example:
		//		Copy in properties from multiple objects.
		//	|	var flattened = whitelistMixin(["name", "legs"], 
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
		whitelist instanceof Array || (whitelist = [whitelist]);
		var filterFunction = function(propName) {
			return indexOf(whitelist, propName) !== -1;
		};
		var args = Array.prototype.slice.call(arguments, 0);
		args[0] = filterFunction;
		return base.filterMixin.apply(base, args);
	};	

	return whitelistMixin;
});