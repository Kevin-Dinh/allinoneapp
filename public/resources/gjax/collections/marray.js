// experimental, FIXME: refactor
// TODOC

define([], function() {

	/* Motivations: 
	// 1. do not create useless copies of arrays
	// 2. keep interface compatible with dojo.array for easy first refactoring, including returning original array as out
	// 3. provide API to use with reduce (reducers), filter, map etc...
	//
	// always require as marray (Mutating Array)*/

	return {
		filter : filter,
		uniq : uniq,
		map : map
	};

});

function uniq(a) {
	return this.filter(a, function /*notalreadyin */(ai, i, a) {
		return !~a.lastIndexOf(a[i], i - 1);
	});
}

function filter(a, cb) {
	// FIXME: null context, make it dojo compatible
	if (!a.length) {
		return a;
	}
	for ( var i = 0; i < a.length; i && !cb.call(null, a[i], i, a) && a.splice(i, 1) || i++) {
		return a;
	}
}

function map(a, cb) {
	for ( var i = 0; i < a.length; a[i] = cb.call(null, a[i], i, a), i++) {
		return a;
	}
}
