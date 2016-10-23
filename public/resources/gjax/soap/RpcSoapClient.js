define([
	"dojo/_base/declare",
	"gjax/xml/Xml",
	"./SoapLite",
	"gjax/log/level",
	"dojox/html/format"
], function(declare, Xml, SoapLite, level, format) {

	/**
	GTI Specific implementation of SingleXmlStringIn SingleXmlOrPlainTextOut RPC/Encoded variant
	**/

	var STYLE_RPC_ENCODED = 0;
	var STYLE_RPC_LITERAL = 1;

	var RpcSoapClient = declare(SoapLite, {
		STYLE_RPC_ENCODED : STYLE_RPC_ENCODED,
		STYLE_RPC_LITERAL : STYLE_RPC_LITERAL,
		style : STYLE_RPC_ENCODED,
		useCDATASection : false,
		buildPayload : function(nodeBody) {
			// TODO: check constraints on this._params
			var xml = nodeBody.ownerDocument;
			var m = Xml.createElementNS(xml, this.targetNs, this._methodName);
			nodeBody.appendChild(m);
			var paramName;
			this.logParams(this._params);
			for (paramName in this._params) {
				var p = Xml.createElementNS(xml, this.targetNs, paramName); // TODO: verify SOAP specs for namespace of param name
				if (this.style == STYLE_RPC_ENCODED) {
					Xml.setAttributeNS(p, Xml.NAMESPACE_XSI, "xsi:type", "xsd:string"); //TODO: BUGGY IN FIREFOX !!!
				}
				var value = this._params[paramName];
				if (value.toXsd) {
					value = value.toXsd();
				}
				var isXml = Xml.instanceOf(value);
				if (isXml) {
					// XML is always sent with CDATA,//this MUST be true because of Safari and Chrome
					value = Xml.getXml(value);
					p.appendChild(xml.createCDATASection(value));
				} else {
					if (this.useCDATASection) {
						p.appendChild(xml.createCDATASection(value));
					} else {
						Xml.setText(p, value);
					}
				}
				m.appendChild(p);
			}
		},
		buildHeaders : function() {
			return {
				//TODO: check SOAP specification (this works on WebSphere 6+ anyway)
				SOAPAction : this.soapAction || '""'
			};
		},
		handleResult : function() {
			var origResult = this.inherited(arguments),
			// Body element
			outNodes = Xml.evalNodes(origResult, "./*[1]/*"), retVal = {}, i, n;
			for (i = 0; i < outNodes.length; i++) {
				n = outNodes[i];
				retVal[Xml.localName(n)] = Xml.getText(n, true);
			}
			this.logResult(retVal);
			return retVal;
		},

		logParams : function(params) {
			if (!level("debug", "gjax/soap/RpcSoapClient")) {
				return;
			}
			console.debug("------------------ PARAMS IN FOR ENDPOINT' " + this.endPoint + "' -------");
			for ( var p in params) {
				var value = params[p];
				if (Xml.instanceOf(value)) {
					value = format.prettyPrint(Xml.getXml(value));
				}
				if (value.indexOf("<") === 0) {
					value = format.prettyPrint(value);

				}
				console.debug("------------------ START PARAM IN '" + p + "' ------------------\r\n" + value);
			}
			console.debug("------------------ END PARAMS IN FOR ENDPOINT' " + this.endPoint + "' -------");
		},
		logResult : function(result) {
			if (!level("debug", "gjax/soap/RpcSoapClient")) {
				return;
			}
			console.debug("------------------ RESULT FOR ENDPOINT' " + this.endPoint + "' -------");
			for ( var p in result) {
				var value = format.prettyPrint(result[p]);
				console.debug("------------------ START PARAM IN '" + p + "' ------------------\r\n" + value);
			}
			console.debug("------------------ END RESULT FOR ENDPOINT' " + this.endPoint + "' -------");
		}
	});

	return RpcSoapClient;

});
