define([
	"./builder",
	"rql/encodeQuery",
	"dojo/_base/lang"
], function(builder, encodeQuery, lang) {
	// summary:
	//		Build URLs with rql queries safely
	// description:
	//      Enhanced gjax/uir/build, which encodes query with rql/queryEncoder

	var ENCODERS = {
		query : function(data) {
			return builder._encode(data, encodeQuery);
		}
	};

	return function(template, param) {
		var encoders = lang.mixin({}, builder._encoders, ENCODERS);
		return builder._build(template, param, encoders, builder._formatters);
	};
});