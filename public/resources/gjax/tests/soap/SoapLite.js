/**
 * created 03/07/2014
 *
 * @author marcus
 *
 * @description POC and design of newer methods in gjax.registry
 *
 * This is mostly designed to help understand runtime status of widgets in screen
 * and for writing selenium-driver JS tests
 *
 */
define([
	"require",
	"dojo/ready",
	"doh",
	"dojo/dom-prop",
	"gjax/soap/RpcSoapClient",
	"gjax/xml/Xml",
	"gjax/xml/XsltProcessor",
	"gjax/syntax/Highlighter",
	"dojox/html/format",
	"dojo/dom",
	"dijit/TitlePane"
], function(require, ready, doh, domProp, RpcSoapClient, Xml, XsltProcessor, Highlighter, format, dom) {

	function callSoap() {
		var soap = new RpcSoapClient(require.toUrl("./data/getPersonOut.xml"), "http://foo.bar.baz");
		soap.HTTP_METHOD = "get"; //just for tests
		return soap.callWS("getPerson", {})//
		.then(function(result) {
			return result.Result;
		});
	}

	var testObject = {
		"Load soap & run transform" : function() {
			return callSoap()//
			.then(function(result) {
				doh.t(!!result, "Result should not be empty");
				domProp.set("n1", "textContent", result);

				new Highlighter({
					brush : "xml",
					content : format.prettyPrint(result)
				})//
				.placeAt("n2")//
				.startup();

				var xmlDoc = Xml.loadXml(result);

				var n4 = dom.byId("n4");
				var xsl = Xml.load(require.toUrl("./data/getPersonOut.xsl"));
				var processor = new XsltProcessor();
				processor.importStylesheet(xsl);
				processor.transformToElement(xmlDoc, n4);

				new Highlighter({
					brush : "xml",
					content : format.prettyPrint(n4.innerHTML)
				})//
				.placeAt("n3")//
				.startup();
			});
		}
	};

	// --------------------------------------
	doh.register("registry", testObject);

	ready(function() {
		doh.run();
	});
});
