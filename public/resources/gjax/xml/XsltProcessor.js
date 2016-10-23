define([
	"./Xml",
	"./has",
	"gjax/log/level",
	"gjax/error",
	"dojo/_base/declare",
	"gjax/_base/kernel",
	"gjax/uri",
	"gjax/uri/Uri"
], function(Xml, has, level, error, declare, gkernel, uri, Uri) {

	var XsltProcessor = declare(null, {
		constructor : function() {
			if (has("xslt-processor")) {
				this._native = new window.XSLTProcessor();
				this._version = "native";
			} else if (has("native-msxml-document")) { //IE10+, where IXMLDOMDocument3 is obtained from Xhr
				this._msxmlDocument = true;//TODO: better name
				this._version = "msxml-document"; //TODO better?
			} else {
				throw new Error("ActiveX variant not implemented");
				// this fails=constructor fails
				/*this._template = Ax.newMSXML("MSXML2.XSLTemplate"); //TODO: test 6.0
				this._version = Ax._chosenMSXMLVersion; //TODO: toto si neviem lepsie odovzdat na _template ani deteknut zatial
				*/
			}
		},

		/* Import the stylesheet into this XSLTProcessor for transformations.
		void  importStylesheet (in nsIDOMNode style)
		*/
		importStylesheet : function(style) {
			if (this._native) {
				this._native.importStylesheet(style);
			} else if (this._msxmlDocument) {
				style.setProperty("AllowDocumentFunction", true);
				style.setProperty("AllowXsltScript", true); //https://msdn.microsoft.com/en-us/library/ms763800(v=vs.85).aspx
				style.resolveExternals = true;
				this._style = style;
			} else {
				style.setProperty("AllowDocumentFunction", true); //fix for MSIE 6.0 (maybe move somewhere else)
				style.resolveExternals = true; //fix for MSIE 6.0 (maybe move somewhere else)
				this._template.stylesheet = style;
				this._processor = this._template.createProcessor();
			}
			/*
			This is important for MS code, but also for some paths in standard code
			transformation of XML->HTML->XMLFragment is nonsence and behaves "incorrectly" in
			Opera and "cannot be coded on MS"
			needed for Opera and method:text
			can be:
			html | xml | text | "nonsence" | null
			null is considered xml (incorrectly however it is suitable for general purpose)
			*/
			this._method = Xml.evalNodeText(style, "/xsl:stylesheet/xsl:output/@method");
		},

//		function setInput(objXSLProcessor, pVar) {
//			try {
//				// toto moze spadnut lebo
//				// a) objXSLProcessor.input=node (a node pochadza z XHR a nie je document a MSXML je 6.0)
//				objXSLProcessor.input = pVar;
//			} catch (ex) {
//				// lepsia detekcia ako catch ma zatial nenapadla
//				// lebo na dom node si verzie neviem odlozit
//				// a inak ich ani zatial neviem detecnut
//				// -2147024809, 0x80070057, "The parameter is incorrect."
//				// E_INVALIDARG The value returned if the variant is not VT_DISPATCH or VT_UNKNOWN.
//				// http://msdn.microsoft.com/en-us/library/ms762245(v=VS.85).aspx
//				if (ex.number == -2147024809 && pVar != null // fix sa tyka iba source ako nodu ine fixovat zatial neviem (ani nepadali)
//						&& pVar.nodeType != 9) {
//					level("warn", "gjax/xml") && console.level("WARNING: objXSLProcessor.setInput fix called");
//					// mark node to find later
//					Xml.setAttributeNS(pVar, "gjax", "xt_fix", "fix objXSLProcessor.input");
//					// drzo predpokladam nezombikov, TODO: test zombies on FF and if working provide fix ?
//					var reloaded = Xml.newClone(pVar.ownerDocument),
//					// aby som nemusel robit setNamespacesSelection
//					pVar2 = Xml.evalNode(reloaded, "//*[count(attribute::*[namespace-uri()='gjax' and local-name()='xt_fix'])>0]");
//					// upratat
//					Xml.removeAttributeNS(pVar, "gjax", "xt_fix");
//					Xml.removeAttributeNS(pVar2, "gjax", "xt_fix");
//					// skusit znova
//					objXSLProcessor.input = pVar2;
//				} else {
//					throw error.newError(new Error(), "XSLTProcessor.setInput", ex);
//				}
//			}
//		}

		/*
		nsIDOMDocumentFragment  transformToFragment (in nsIDOMNode source, in nsIDOMDocument output)
		Transforms the node source applying the stylesheet given by the importStylesheet() function.

		TODO: matrix for TEXT,HTML,XML methods vs. outoput as XMLDom or HTMLDom.
		*/
//		transformToFragment : function(source, output) {
//			var f, container;
//			if (this._native) {
//				if (this._method == "text") {
//					f = this._native.transformToFragment(source, output);
//					if (f.firstChild.nodeType != 3) {
//						//fix for opera's <result>text</result> behavior
//						var f1 = output.createDocumentFragment();
//						container = f.firstChild;
//						while (container.hasChildNodes()) {
//							f1.appendChild(container.firstChild);
//						}
//						f = f1;
//					}
//				} else {
//					f = this._native.transformToFragment(source, output);
//				}
//				// Safari problem: https://bugs.webkit.org/show_bug.cgi?id=5446
//				// Bug 5446: WebKit's XSLTProcessor implementation does not throw XSLTExceptions
//				// Chrome may transform partially,
//				// !!! = no chance to find template errors !!!!
//				//if(f.fisrChild==null) throw new Error("transformToFragment return null, invalid XSLT template ?");
//				if (f == null) {
//					throw new Error("transformToFragment return null, invalid XSLT template ?");
//				}
//
//				return f;
//			}
//
//			// MSIE code
//			// output can be XMLDomDocument or DOMDocument in MS both must be treated differently)
//			// method can be text, html or xml or null
//			f = output.createDocumentFragment();
//			setInput(this._processor, source);
//
//			var str;
//			// switch output to DOM or string based on method and out DOM type
//			// transform
//			// switch result processing based on method and out DOM type
//			if (this._method == "text") /* html_text, xml_text */
//			{
//				this._processor.output = null; //transform as string
//				this._processor.transform();
//				str = this._processor.output;
//				f.appendChild(output.createTextNode(str));
//			} else if (output.implementation.hasFeature("HTML", "1.0")) { /* html_html, html_xml */
//
//				//if(this._method=="HTML")
//				this._processor.output = null; //transform as string
//				this._processor.transform();
//				str = this._processor.output;
//				container = output.createElement('div'); //TODO: leaks !
//				container.innerHTML = str;
//				while (container.hasChildNodes()) {
//					f.appendChild(container.firstChild);
//				}
//				// remove XML preambule from fragment
//				if (f.firstChild.nodeType == 7 && f.firstChild.nodeName == "xml") {
//					f.firstChild.parentNode.removeChild(f.firstChild);
//				}
//			} else if (output.implementation.hasFeature("XML", "1.0")) {
//				if (this._method == "html") {
//					var wrtr = Ax.newMSXML("Msxml2.MXXMLWriter"); //TODO: sync with newActiveXObject
//					wrtr.output = Xml.loadXml("<foobar/>");
//					this._processor.output = wrtr;
//					this._processor.transform();
//					wrtr.flush();
//					container = wrtr.output;
//				} else {
//					this._processor.output = Xml.loadXml("<foobar/>"); // nemam metodu na empty dom, TODO: treba ?
//					this._processor.transform();
//					var e = Xml.getParserError(this._processor.output);
//					if (e != null) {
//						throw e;
//					}
//					container = this._processor.output;
//				}
//				while (container.hasChildNodes()) {
//					f.appendChild(container.firstChild);
//				}
//				// remove XML preambule from fragment
//				if (f.firstChild.nodeType == 7 && f.firstChild.nodeName == "xml") {
//					f.firstChild.parentNode.removeChild(f.firstChild);
//				}
//			} else {
//				throw new Error("Unsupported");
//			}
//			this._processor.output = null;
//			return f;
//		},
		/*
		nsIDOMDocument  transformToDocument (in nsIDOMNode source)
		Transforms the node source applying the stylesheet given by the importStylesheet() function.
		*/
		transformToDocument : function(source) {
			///<param name="source" optional="false">
			///		Remarks: za istych okolnosti si transformacia robi kopiu, pozri setInput
			///</param>
			var e;
			if (this._native) {
				var d = this._native.transformToDocument(source);
				// Bug 5446: WebKit's XSLTProcessor implementation does not throw XSLTExceptions
				if (d == null) {
					throw new Error("transformToDocument returned null");
				} else {
					e = Xml.getParserError(d);
					if (e != null) {
						throw e;
					}
				}
				return d;
			}

			if (this._msxmlDocument) {//IE10-11
				var transformedXmlStr = source.transformNode(this._style);
				console.log(transformedXmlStr);
				return Xml.loadXml(transformedXmlStr);
			}

			throw new Error("ActiveX variant not implemented");

			//TODO: AR not ported yet

//			// MSIE code
//			this._processor.output = null;
//			setInput(this._processor, source);
//			var retDom = Xml.loadXml("<result xmlns='gjax'/>");
//			if (this._method == "text") {
//				this._processor.output = null;
//				// nemam metodu na empty dom, TODO: treba ?
//				this._processor.transform();
//				retDom.documentElement.appendChild(retDom.createTextNode(this._processor.output));
//			} else if (this._method == "html") {
//				/* by sarissa but it is not HTML Dom document byt XML dom document */
//				var wrtr = Ax.newMSXML("Msxml2.MXXMLWriter"); //TODO: sync with newActiveXObject
//				wrtr.output = Xml.loadXml("<foobar/>");
//				this._processor.output = wrtr;
//				this._processor.transform();
//				wrtr.flush();
//				return wrtr.output;
//				/*
//				non functioning alternative
//				this produces HTMLDom however it requires IFRAME to be appended and
//				not removed from document
//
//				this._processor.output=null;
//				this._processor.transform();
//				var iFrame=document.createElement("IFRAME");
//				iFrame.style.display="none";
//				iFrame=document.body.appendChild(iFrame);
//				iFrame.contentWindow.document.open("text/html",null);
//				iFrame.contentWindow.document.write(this._processor.output);
//				iFrame.contentWindow.document.close();
//				//iFrame.parentNode.removeChild(iFrame);
//				return iFrame.contentWindow.document;
//				*/
//			} else {
//				this._processor.output = retDom; // nemam metodu na empty dom, TODO: treba ?
//				this._processor.transform();
//				e = Xml.getParserError(this._processor.output);
//				if (e != null) {
//					throw e;
//				}
//			}
//			return retDom;
		},
		// gjax extension
//		transformToString : function(source) {
//			if (this._method != "text") {
//				throw new Error("Illegal xsl:output method, expected 'text'");
//			}
//			if (this._native) {
//				var doc = this._native.transformToDocument(source), pre, result;
//				if ((result = Xml.evalNode(doc, "/*[local-name()='result']"))) {
//					return result.textContent;
//				}
//				if ((pre = Xml.evalNode(doc, "//*[local-name()='pre']"))) {
//					return pre.textContent;
//				}
//				throw new Error("Not Implemented, unexpected result from transformation");
//			} else {
//				setInput(this._processor, source);
//				this._processor.output = null;
//				this._processor.transform();
//				return this._processor.output;
//			}
//		},
		// gjax extension
		//TODO: test on element from different dom *iframe window etc... !
		//TODO: think of replacing the original element with new one (not only appending childs)
		transformToElement : function(source, element) {
			if (this._method != "html") {
				throw new Error("Illegal xsl:output method, expected 'html'");
			}
			if (this._native) {
				/*var f=this._native.transformToFragment(source,element.ownerDocument); //buggy safari !*/
				//var f = this.transformToFragment(source, element.ownerDocument); // call this, not this._native to fix null
				//AR: just try using native for now, TODO - see previous lines
				var f = this._native.transformToFragment(source, element.ownerDocument);
				while (f.hasChildNodes()) {
					element.appendChild(f.firstChild);
				}
			} else if (this._msxmlDocument) {//IE10-11
				var transformedStr = source.transformNode(this._style);
				element.innerHTML = transformedStr;
			} else {
				throw new Error("ActiveX variant not implemented");
				/*setInput(this._processor, source);
				this._processor.output = null;
				this._processor.transform();
				element.innerHTML = this._processor.output;*/
			}

			return element.firstChild;
		},
		/*
		void  setParameter (in DOMString namespaceURI, in DOMString localName, in nsIVariant value)
		Sets a parameter to be used in subsequent transformations with this nsIXSLTProcessor.
		*/
		setParameter : function(namespaceURI, localName, value) {
			if (this._native) {
				return this._native.setParameter(namespaceURI, localName, value);
			}
			//MSIE code
			if (namespaceURI) {
				return this._processor.addParameter(localName, value, namespaceURI);
			} else {
				return this._processor.addParameter(localName, value);
			}
		},
		/*
		nsIVariant  getParameter (in DOMString namespaceURI, in DOMString localName)
		Gets a parameter if previously set by setParameter.
		*/
		getParameter : function(/*namespaceURI, localName*/) {

		},
		/*
		void  removeParameter (in DOMString namespaceURI, in DOMString localName)
		Removes a parameter, if set.
		*/
		removeParameter : function(/*namespaceURI, localName*/) {

		},
		/*
		void  clearParameters ()
		Removes all set parameters from this nsIXSLTProcessor.
		*/
		clearParameters : function() {

		},
		/*
		void  reset ()
		Remove all parameters and stylesheets from this nsIXSLTProcessor.
		*/
		reset : function() {

		},
		loadStylesheet : function(uriStr) {
			if (this._msxmlDocument || !this._native || (has("safari") || has("chrome"))) {
				return Xml.load(uriStr);
			}
			//TODO: maybe also other browsers does not need to go here
			//this is original condition from old code + _msxmlDocument
			return loadStyleSheet(uriStr);

		}
	});

	/**
	Experimental implementation of fix for
	WebKit import, include bug https://bugs.webkit.org/show_bug.cgi?id=10313
	xsd:include is fixed
	xsd:import	is not supported yet
	**/
	function replaceNodes(node, nodeSet) {
		// this is safari only version not working in MSXML 3.0 Ax
		gkernel.asrt(has("xml-import-node"), "xsl:inlcude workaround requires XML.importNode support !");
		var i, newNode;
		for (i = 0; i < nodeSet.length; i++) {
			newNode = node.ownerDocument.importNode(nodeSet[i], true);
			node.parentNode.insertBefore(newNode, node);
		}
		node.parentNode.removeChild(node);
	}
	function loadStyleSheet(_uri) {
		var doc = Xml.load(_uri);
		var incNodes = Xml.evalNodes(doc, "/xsl:stylesheet/xsl:include");
		var impNodes = Xml.evalNodes(doc, "/xsl:stylesheet/xsl:import");

		if (impNodes.length > 0) {
			throw new Error("xsd:import not supported");
		}
		if (incNodes.length === 0) {
			return doc; //nothing to do
		}
		for (var i = 0; i < incNodes.length; i++) {
			var incNode = incNodes[i];
			var ref = incNode.getAttribute("href");
			var includedUrl = Uri.resolve(Uri.resolve(null, _uri), ref);
			var includedDoc = loadStyleSheet(includedUrl);
			var toCopy = includedDoc.documentElement.childNodes; //TODO: http://www.w3.org/TR/xslt#result-element-stylesheet

			replaceNodes(incNode, toCopy);
		}
		return doc;
	}

	return XsltProcessor;

});
