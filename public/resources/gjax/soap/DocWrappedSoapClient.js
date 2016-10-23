define([
	"dojo/_base/declare",
	"./DocSoapClient",
	"gjax/xml/Xml",
	"gjax/_base/kernel"
], function(declare, DocSoapClient, Xml, gkernel) {

	var DocWrappedSoapClient = declare(null, {
		buildPayload : function(nodeBody) {
			gkernel.asrt(this.targetNs && this._methodName);
			this.inherited(arguments, [
				nodeBody.appendChild(Xml.createElementNS(nodeBody.ownerDocument, this.targetNs, this._methodName))
			]);
		},
		handleResult : function() {
			var origResult = this.inherited(arguments);
			gkernel.asrt(origResult == null || Xml.baseName(origResult) == this._methodName + "Response");
			return origResult == null ? null : Xml.evalNode(origResult, "./*"); //stale moze vratit null !
		}
	});

	return DocWrappedSoapClient;

});
