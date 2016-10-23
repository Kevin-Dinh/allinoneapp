define([
	"gjax/perf/_perf",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/_base/array",
	"./aspect"//load aspect, otherwise recursive loading of Deferred fails - TODO: check why
], function(perf, on, lang, array) {

	var aspectHandles = perf.handlers.aspects;
	var onHandles = perf.handlers.ons = {
		names : {},
		handles : [],
		add : function(handle, name) {
			if (aspectHandles.contains(handle)) {
				aspectHandles.remove(handle);
			}
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

	var origParse = on.parse; //method in which all on methods meet

	on.parse = function(target, type) {
		var h = origParse.apply(on, arguments);

		//do not handle events defined by function, they will internally call another ON, that will be used
		if (!lang.isFunction(type)) {

			// on.parse may internally call on.parse, but same handler instance is returned
			// for this situations, remove handler created internally, we are interested in those that were created explicitely
			// (if we do not do this, there would be multiple removes for top event, and none for internal)
			if (h._name && onHandles.contains(h)) {
				onHandles.remove(h);
			}

			onHandles.add(h, type);

			//handle removing aspect
			h.remove = lang.partial(patchedRemove, h, h.remove);
		}
		return h;
	};

	function patchedRemove(_h, _remove) {
		// same handler may be reused by multiple on.parse
		// execute removing only once (for top event handler)
		// inner handlers have been already removed (see above)
		if (!_h._removed && onHandles.contains(_h)) {
			onHandles.remove(_h); 
		}
		_h._removed=true;
		_remove.apply(_h, arguments);
	}
	return on;
});