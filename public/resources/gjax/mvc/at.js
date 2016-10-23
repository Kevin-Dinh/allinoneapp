define([
	"dojox/mvc/at"
], function(at) {
	var bindingToResolvedPattern = /^resolved\:([^\:]+)(?:\:(.+))?/; //matches "resolved:foo", and "resolved:foo:bar" 

	var _at = function(target, targetProp) {
		var match = targetProp.match && targetProp.match(bindingToResolvedPattern);
		if (match) {
			targetProp = "_" + match[1] + "Item";
			var retVal = at(target, targetProp);
			retVal.bindingToResolved = match[2] || true; //match[2] may contain name of resolvedProperty (default is just true) - name of resolved prop will be calculated from global suffix
			return retVal;
		} else {
			return at(target, targetProp);
		}
	};

	_at.from = at.from;
	_at.to = at.to;
	_at.both = at.both;

	return _at;
});