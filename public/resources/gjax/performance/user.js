define([
	"dojo/_base/array",
	"gjax/error"
], function(array, error) {

	return function(perf) {
		//we need acces to performance object (native or gjax), but we cannot requrie gjax/performance (cyclic dep)
		//so make this module as factory, which accepts performance object as argument

		return {
			_marks : [],
			_measures : [],
			mark : function(markName) {
				this._marks.push({
					name : markName,
					entryType : "mark",
					startTime : perf.now(),
					duration : 0
				});
			},
			clearMarks : function(markName) {
				if (markName) {
					var newMarks = array.filter(this._marks, function(item) {
						return item.name != markName;
					});
					var args = [
						0,
						this._marks.length
					].concat(newMarks);
					this._marks.splice.apply(this._marks, args);
				} else {
					this._marks.splice(0, this._marks.length);
				}

			},
			measure : function(/*measureName, startMark, endMark*/) {
				throw error.newError(new Error(), "Not implemented", null, "gjax/performance/user", "UnimplementedMethodException");

			},
			clearMeasures : function(/*measureName*/) {
				throw error.newError(new Error(), "Not implemented", null, "gjax/performance/user", "UnimplementedMethodException");
			}
		};
	};
});