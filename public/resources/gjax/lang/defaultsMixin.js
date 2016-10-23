define([
	"./_base"
], function(base) {

	// summary:
	//		Assigns own enumerable properties of source object(s) to the destination object for all 
	//		destination properties that resolve to undefined. 
	//		Once a property is set, additional values of the same property are ignored.
	//		name inspired by lodash.defaults
	
	function overrideUndefined(name, source, dest) {
		return dest[name] === undefined;
	}
	function overrideNulls(name, source, dest) {
		return dest[name] == null;
	}
	function overrideNotIn(name, source, dest) {
		return !(name in dest);
	}

	function impl(overrideStrategy) {

		return function(/*dest, sources*/) {

			var args = Array.prototype.slice.call(arguments, 0);
			args.unshift(overrideStrategy);
			return base.filterMixin.apply(base, args);
		};

	}

	var defaultMixin = impl(overrideUndefined);
	defaultMixin.nulls = impl(overrideNulls);
	defaultMixin.notIn = impl(overrideNotIn);

	return defaultMixin;
});