define([
	"dojo/request/xhr"
], function(request) {

	return function(url) {
		var http, ex;
		request.get(url, {
			sync : true,
			handleAs : "xml" //added to dojo/request/xhr - responseType will be set to msxml-document if unspported
		}).response//
		.then(function(response) {
			http = response.xhr;
		})//
		.otherwise(function(err) {
			ex = err; //thrown exception from here would be drawn
		});

		if (ex) {
			throw ex;
		}

		if (http.status != 200) {
			throw new Error("Non 200 message received, to load XMLs with other codes use XmlHttpRequest");
		}

		if (http.responseXML == null) {
			// this error is common on non MSIE parsers 
			// when server answers with "NON-XML Content-Type" (.xslt on casiny for example)
			var e = new Error();
			e.name = "ParserError";
			e.message = "Error parsing url:" + url + "\r\nRaw data is:\r\n" + http.responseText;
			throw e;
		}

		return http;
	};

});