define([
	"gjax/perf/_perf",
	"dojo/aspect",
	"dojo/_base/array"
], function(perf, aspect, array) {

	var aspectHandles = perf.handlers.aspects = {
		names : {},
		handles : [],
		add : function(handle, name) {
			handle._name = name;

			if (!(name in this.names)) {
				this.names[name] = 1;
			} else {
				this.names[name]++;
			}
			this.handles.push(handle);
		},
		remove : function(handle) {
			var idx = array.indexOf(this.handles, handle);
			if (idx >= 0) {
				this.handles.splice(idx, 1);
				this.names[handle._name]--;
				if (this.names[handle._name] === 0) {
					delete this.names[handle._name];
				}
			}
		},
		contains : function(handle) {
			return array.indexOf(this.handles, handle) >= 0;
		}
	};
	return {
		after : wrap("after"),
		around : wrap("around"),
		before : wrap("before")
	};

	function wrap(type) {
		return function(target, methodName, advice, receiveArguments) {
			var h = aspect[type](target, methodName, advice, receiveArguments);

			//REVIEW: are aspects added by dojo/_base/fx safe? (line 603)
			//do not handle aspects hooked by fx, they are never removed explicitly
			if (isAnimation(target)) {
				return h;
			}

			var n = type + ";" + methodName;

			aspectHandles.add(h, n);

			//handle removing aspect
			var origRemove = h.remove;
			h.remove = function() {
				if (aspectHandles.contains(h)) {
					aspectHandles.remove(h);
				}
				origRemove.apply(h, arguments);
			};
			return h;
		};
	}

	function isAnimation(obj) {
		//We may not require dojo/_base/fx to check directly instance of fx.Animation (becasue of cyclic dependencies)
		//so check existence of some of its methods
		return obj._cycle && obj._fire && obj._play && obj._getStep;
	}

});