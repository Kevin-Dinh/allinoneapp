define([
	"dojo/_base/declare",//for docs
	"dojo/_base/lang",
	"gjax/collections/indexOf",
	"dojox/mvc/StatefulArray",
	"./EnhancedStateful",
	"dojo/Stateful"
], function(declare, lang, indexOf, StatefulArray, EnhancedStateful, Stateful) {

	//experimental

	var EnhancedStatefulArray = function(/*Anything[]*/a) {

		var statefulArray = new StatefulArray(a);
		var ctor = EnhancedStatefulArray;
		statefulArray.constructor = ctor;

		//return statefulArray;
		return lang.mixin(statefulArray, {
			_watchCount : 0,
			_watchedProps : null,
			_watchedPropsHandles : null,
			watch : EnhancedStateful.prototype.watch,
			_getParentProp : function(value, parent, origParentProp) {
				return lang.isArray(parent) ? indexOf(parent, value) : origParentProp;
			},
			splice : function(/*Number*/idx, /*Number*/n) {
				// summary:
				//		Removes and then adds some elements to an array.
				//		watchElements() notification is done for the removed/added elements.
				//		watch() notification is done for the length.
				//		Returns an instance of StatefulArray instead of the native array.
				// idx: Number
				//		The index where removal/addition should be done.
				// n: Number
				//		How many elements to be removed at idx.
				// varargs: Anything[]
				//		The elements to be added to idx.
				// returns: dojox/mvc/StatefulArray
				//		The removed elements.

				var l = this.get("length");

				idx += idx < 0 ? l : 0;

				var p = Math.min(idx, l), removals = this.slice(idx, idx + n), adds = lang._toArray(arguments).slice(2);

				// Do the modification in a native manner except for setting additions
				[].splice.apply(this, [
					idx,
					n
				].concat(new Array(adds.length)));

				// Set additions in a stateful manner
				for (var i = 0; i < adds.length; i++) {
					//this[p + i] = adds[i]; AR: override dojox version
					this.set(p + i, adds[i]);
				}

				// Notify change of elements.
				if (this._watchElementCallbacks) {
					this._watchElementCallbacks(idx, removals, adds);
				}

				// Notify change of length.
				// Not calling the setter for "length" though, given removal/addition of array automatically changes the length.
				if (this._watchCallbacks) {
					this._watchCallbacks("length", l, l - removals.length + adds.length);
				}

				return removals; // dojox/mvc/StatefulArray
			}
		});

	};

	/*=====
	EnhancedStatefulArray = declare([StatefulArray], {	
		// summary:
		//		Enhanced dojox/mvc/StatefulArray 
		// description:
		//		Enhanced dojox/mvc/StatefulArray that can handle watching children stateful properties
	});
	=====*/

	EnhancedStatefulArray._meta = {
		bases : [
			Stateful,
			EnhancedStateful,
			EnhancedStateful._HierarchicalStatefulMixin,
			EnhancedStateful._ResolvedItemMixin
		]
	}; // For isInstanceOf()
	return EnhancedStatefulArray;
});
