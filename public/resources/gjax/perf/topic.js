define([
	"gjax/perf/_perf",
	"dojo/topic",
	"dojo/_base/lang",
	"dojo/_base/array",
	"./on" //to ensure window.perf.handlers.ons
], function(perf, topic, lang, array) {
	var aspectHandles = perf.handlers.aspects;
	var onHandles = perf.handlers.ons;
	var topicHandles = perf.handlers.topics = {
		names : {},
		handles : [],
		add : function(handle, name) {
			if (aspectHandles.contains(handle)) {
				aspectHandles.remove(handle);
			}
			if (onHandles.contains(handle)) {
				onHandles.remove(handle);
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
	return {
		publish : lang.hitch(topic, "publish"),
		subscribe : function(topicName, listener) {
			var h = topic.subscribe(topicName, listener);

			topicHandles.add(h, topicName);

			//handle removing aspect
			var origRemove = h.remove;
			h.remove = function() {
				if (topicHandles.contains(h)) {
					topicHandles.remove(h);
				}
				origRemove.apply(h, arguments);
			};
			return h;
		}
	};
});