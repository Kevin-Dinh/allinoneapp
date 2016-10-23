define([
	"dojo/_base/declare",
	"gjax/xml/Xml",
	"gjax/log/level",
	"gjax/_base/kernel",
	"gjax/error",
	"gjax/error/_httpHandler",
	"dojo/request/registry",
	"dojo/_base/lang"
], function(declare, Xml, level, gkernel, error, _httpHandler, request, lang) {

	//TODO: rewrite to dojo/request

	/**
	Alternativna (stara) implementacia SOAP stacku
	bez RequestManagera, bez SoapXhtTrans

	All current implementations
	have IT'S OWN XML,
	created and reused in this._requestXml
	RPC style params: create by DOM inside this._requestXml
	DOC style params: are cloned and appended to this._requestXml (works XB which is strange !)

	**/
	//TODO: localzie all messages
	var AbstractSoapClient = declare(null, {
		constructor : function(endPoint, targetNs) { // default auto chaining
			// TODO: check constraints
			this.endPoint = endPoint;
			this.targetNs = targetNs;
		},
		//constants
		NAMESPACE_ENV : "http://schemas.xmlsoap.org/soap/envelope/",

		//public API members
		endPoint : null,
		targetNs : null,
		soapAction : null,

		//protected API members
		_methodName : null,
		_params : null,
		_logger : null,
		_requestXml : null, //as member for reuse and logging
		/**
		general callWS implementation
		"parametrized" with calls to overriden methods
		! not expected to be overriden

		@methodName	- anything depends on inherited class (beware of relMapper)
		@params		- anything depends on inherited class
		@returns	- in async	void
		- in sync 	depends on handleResult
		**/

		HTTP_METHOD : "post",

		callWS : function(methodName, params) {

			if (this._requestPromise && !this._requestPromise.isFulfilled()) {
				throw new Error("Illegal state, call already running");
			}

			// store as private members (avoid parameters passing)
			// TODO: when to clear ?
			this._methodName = methodName;
			this._params = params;

			// prepare general Envelope XML
			if (this._requestXml == null) {
				this._requestXml = Xml.loadXml("<Envelope xmlns='" + this.NAMESPACE_ENV + "' " + " xmlns:xsd='" + Xml.NAMESPACE_XSD + "'" + " xmlns:xsi='"
						+ Xml.NAMESPACE_XSI + "'><Body></Body></Envelope>");
			}
			var bodyNode = this._requestXml.documentElement.firstChild;
			// remove old payload
			while (bodyNode.hasChildNodes()) {
				bodyNode.removeChild(bodyNode.firstChild);
			}

			// call specific style/use overriden version to fill body element with payload
			this.buildPayload(bodyNode); // body element

			this.logInput();

			this._requestPromise = request(this.endPoint, {
				method : this.HTTP_METHOD,
				headers : this.buildHeaders(),
				handleAs : "xml",
				data : Xml.getXml(this._requestXml)
			})//
			.response//
			.then(lang.hitch(this, "handleResult"), lang.hitch(this, "handleErr"));

			return this._requestPromise;
		},

		/**
		Override this for different types of style/use
		use @nodeBody, this._methodName,this._params, or this.* (public members inside the method)
		**/
		buildPayload : function(nodeBody) {
			// void implementation, return empty body
			return nodeBody;
		},
		/**
		Override this for different types of style/use
		use this._http, this._methodName,this._params, or this.* (public members inside the method)
		**/
		buildHeaders : function() {
			// void implementation, sets no headers
			return;
		},
		/**
		Override this for different types of style/use
		Used in sync and asyn modes
		in sync mode
		@return		/s:Envelope/s:Body
		@throws
		SoapFaultException	(if 500 and SoapFault present)
		HttpException		(if 500 and no XML, or other status)
		ConnectException	(if status out of http range 100-599)
		Error				if unknown error happends (200 and no XML, 500 and XML and no SoapFault) etc...
		in async mode
		calls callbackFunction with @return and @throws values
		**/
		handleResult : function(response) {
			var xhr = response.xhr;
			var xmlOut = xhr.responseXML; //pointer
			gkernel.asrt(xmlOut != null, "Protocol error, 200 OK and no XML response");
			Xml.setSelectionNamespaces(xmlOut, {
				s : this.NAMESPACE_ENV
			});
			this.logOutput(xhr);
			return Xml.evalNode(xmlOut, "/s:Envelope/s:Body"); //pointer
		},

		handleErr : function(err) {
			throw _httpHandler.handle(err);
		},
		/*
		Override this for different types of style/use
		Methods can use protected members
		*/
		logInput : function() {
			if (!level("debug", "gjax/soap/SoapLite")) {
				return;
			}
			console.debug("------------------ START IN XML ------------------\r\n" + Xml.getXml(this._requestXml)
					+ "\r\n------------------ END IN XML ------------------");
		},
		logOutput : function(xhr) {
			if (!level("debug", "gjax/soap/SoapLite")) {
				return;
			}
			console.debug("------------------ START OUT XML ------------------\r\n" + Xml.getXml(xhr.responseXML)
					+ "\r\n------------------ END OUT XML ------------------");
		}
	});

	return AbstractSoapClient;

});
