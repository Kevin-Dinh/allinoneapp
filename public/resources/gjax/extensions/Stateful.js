define([
	"dojo/_base/array",
	"dojo/has",
	"dojo/_base/lang",
	"dojo/Stateful",
	"dojox/mvc/ModelRefController",
	"dojo/has!debug?gjax/perf/_perf"
], function(array, has, lang, Stateful, ModelRefController, perf) {

	var watchOrig = Stateful.prototype.watch;
	var extension = {
		watch : function() {
			//Destroyable will not correctly remove its aspect, if unwatch is called instead of remove 
			//should be not needed in 2.0
			var h = watchOrig.apply(this, arguments);
			h.unwatch = function() {
				h.remove();
			};
			return h;
		},
		watchPausable : function(/*String?*/name, /*Function*/callback) {
			// summary:
			//		This function acts the same as watch(), but with pausable functionality. The
			//		returned signal object has pause() and resume() functions. Calling the
			//		pause() method will cause the listener to not be called for future events. Calling the
			//		resume() method will cause the listener to again be called for future events.
			var paused;

			//this is tricky, because name may be ommited
			var args = [
				function() {
					if (!paused) {
						return (callback || name).apply(this, arguments);
					}
				}
			];
			if (callback) {
				args.unshift(name);
			}

			var signal = this.watch.apply(this, args);

			signal.pause = function() {
				paused = true;
			};
			signal.resume = function() {
				paused = false;
			};
			return signal;
		},
		watchOnce : function(/*String?*/name, /*Function*/callback) {
			// summary:
			//		This function acts the same as on(), but will only call the listener once. The 
			//		listener will be called for the first
			//		event that takes place and then listener will automatically be removed.

			//this is tricky, because name may be ommited
			var signal;
			var args = [
				function() {
					// remove this listener
					if (lang.isArray(signal)) {
						array.forEach(signal, function(s) {
							s.remove();
						});
					} else {
						signal.remove();
					}
					// proceed to call the listener
					return (callback || name).apply(this, arguments);
				}
			];
			if (callback) {
				args.unshift(name);
			}

			signal = this.watch.apply(this, args);
			return signal;
		}
	};

	//model ref controller has own watch, patch also it
	var mWatchOrig = ModelRefController.prototype.watch;
	ModelRefController.extend({
		watch : function() {
			var h = mWatchOrig.apply(this, arguments);
			h.unwatch = function() {
				h.remove();
			};
			return h;
		}
	});

	//logging of hanles for watch (aspects, topics and events are handled separatelly in gjax/perf)
	if (perf) {
		var watchHandles = perf.handlers.watches = {
			names : {},
			handles : [],
			add : function(handle, name) {
				if (this.contains(handle)) {
					return; //to prevent double adding same handle for Stateful and ModelRefController
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

		extension.watch = function(name) {
			var _name = name;
			if (lang.isFunction(name)) {
				_name = "*";
			}
			var h = watchOrig.apply(this, arguments);

			watchHandles.add(h, _name);

			//handle removing watch
			var origRemove = h.remove;
			h.remove = function() {
				if (watchHandles.contains(h)) {
					watchHandles.remove(h);
				}
				origRemove.apply(h, arguments);
			};
			h.unwatch = function() {
				h.remove();
			};
			return h;
		};

		//model ref controller has own watch
		ModelRefController.extend({
			watch : function(name) {
				var _name = name;
				if (lang.isFunction(name)) {
					_name = "*";
				}
				_name += ";cntr";
				var h = mWatchOrig.apply(this, arguments);

				watchHandles.add(h, _name);

				//handle removing watch
				var origRemove = h.remove;
				h.remove = function() {
					if (watchHandles.contains(h)) {
						watchHandles.remove(h);
					}
					origRemove.apply(h, arguments);
				};
				h.unwatch = function() {
					h.remove();
				};
				return h;
			}
		});
	}

	return Stateful.extend(extension);
});