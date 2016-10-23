define([
	"require",
	"./has",
	"./_syncXmlRequest",
	"./_xmlToObjectUrl",
	"gjax/_base/kernel"
], function(require, has, _syncXmlRequest, _xmlToObjectUrl, gkernel) {

	var msxmlDocument;

	return {
		get : function() {
			//TODO: for IE9 (trident 5), try some data uri as well (object url: not compatible, data uri: access denied)
			var url = has("trident") == 5 ? require.toUrl("./_msxmlDocument.xml") : _xmlToObjectUrl("<root/>");
			var http = _syncXmlRequest(url);

			if (!msxmlDocument) {
				msxmlDocument = http.responseXML;
				gkernel.asrt(!!msxmlDocument, "responseXml property expected on http");

				msxmlDocument.async = false;
				msxmlDocument.validateOnParse = false;
				msxmlDocument.preserveWhiteSpace = true;
			}
			return msxmlDocument.cloneNode(false);
		}
	};

});