define([
	"dojo/_base/declare",
	"gjax/xml/Xml",
	"./SoapLite",
	"gjax/_base/kernel"
], function(declare, Xml, SoapLite, gkernel) {

	var DocSoapClient = declare(SoapLite, {
		buildPayload : function(nodeBody) {
			gkernel.asrt(this._params == null || Xml.instanceOf(this._params));
			if (this._params != null) {
				if (this._params.nodeType == 9) {
					this._params = this._params.documentElement;
				}
				//strange but runs crossbrowser ;-)) even with MSXML 3.0 (TODO:testcase)
				nodeBody.appendChild(this._params.cloneNode(true));
			}
		},
		buildHeaders : function() {
			this._http.setRequestHeader("SOAPAction", this.soapAction); //TODO: check SOAP specification (this works on WebSphere 6+ anyway)
			this._http.setRequestHeader("Content-Type", "text/xml");
		},
		handleResult : function() {
			try {
				var origResult = this.inherited(arguments),
				// Body element
				outNode = Xml.evalNode(origResult, "./*");
				//TODO: pri wrapped by to malo mat nazov methodName+Response
				return outNode;
			} catch (ex) {
				throw ex;
			}
		}

	});

	return DocSoapClient;

});
