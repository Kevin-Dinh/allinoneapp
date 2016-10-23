define([
	"dojo/_base/array",
	"gjax/collections/indexOf",
	"dojo/request/notify",
	"gjax/uri/Uri",
	"gjax/log/level",
	"dojo/on"
], function(array, indexOf, notify,  Uri, level, on) {

	return function(perf) {
		//we need acces to performance object (native or gjax), but we cannot requrie gjax/performance (cyclic dep)
		//so make this module as factory, which accepts performance object as argument

		var outgoing = [];

		notify("send", function(response /*, cancel*/) {
			response._startTime = perf.now();
			outgoing.push(response);
		});

		notify("done", function(responseOrError) {
			var response = responseOrError instanceof Error ? responseOrError.response : responseOrError;

			var idx = indexOf(outgoing, response);
			if (idx == -1) {
				console.warn("request for response not found: " + response.url);
				return;
			}
			outgoing.splice(idx, 1);
			perf._addResource(response._startTime, perf.now(), response.url);
		});

		var resource = {
			_resources : [],
			_bufferSizeLimit : 150,
			_bufferFull : false,
			clearResourceTimings : function() {
				this._resources.splice(0, this._resources.length);
				this._bufferFull = false;
			},
			setResourceTimingBufferSize : function(bufferSizeLimit) {
				this._bufferSizeLimit = bufferSizeLimit;
				this._bufferFull = false; //according to spec, next 'add' may set it to false
			},
			_addResource : function(startTime, endTime, url) {
				if (this._bufferSizeLimit > this._resources.length) {
					this._resources.push({
						name : Uri.resolve(null, url),
						entryType : "resource",
						startTime : startTime,
						duration : endTime - startTime,
						initiatorType : "xmlhttprequest",
						redirectStart : NaN,
						redirectEnd : NaN,
						fetchStart : NaN,
						domainLookupStart : NaN,
						domainLookupEnd : NaN,
						connectStart : NaN,
						connectEnd : NaN,
						secureConnectionStart : NaN,
						requestStart : NaN,
						responseStart : NaN,
						responseEnd : endTime
					});
					return;
				} else if (!this._bufferFull) {
					this._bufferFull = true;
					level("debug", "gjax/performance") && console.log("gjax/performance/resource:", "Firing event resourcetimingbufferfull.");
					on.emit(this, "resourcetimingbufferfull", {
						bubbles : true
					});
					// even when some buffer clearing will be processed on resourcetimingbufferfull, we will miss current record
					// but this is the implementation according to spec
				}
				level("debug", "gjax/performance") && console.log("gjax/performance/resource:", "New resource not added, buffer is full.", url);
			}
		};

		// For browsers that do not support performance events (e.g. IE, FF), 
		// this method must exists to hook on event
		if (!perf.addEventListener) {
			resource.onresourcetimingbufferfull = function() {
			};
		}
		return resource;
	};

});