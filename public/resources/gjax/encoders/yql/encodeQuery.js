//WORK IN PROGRES
define([],function(){

	var regexp = RegExp(
		// unsafe (u) // TODO add more
		"([\u0022\u0027])", "g"
		),
	replacer = function(m) {
		return "\\" + m;
	};
	
	return function(s) {
		// summary:
		//		Use to encode strings for YQL queries.
		// description:
		//		Escapes single quote (') and double quote (").
		// s: String
		//		String to encode.
		// returns:	String
		//		Encoded string.
		return s.replace(regexp, replacer);
	};

});