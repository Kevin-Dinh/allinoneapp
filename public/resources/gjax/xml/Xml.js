define([
	"exports", //cyclic dependency with ./has
	"./has",
	"./has!native-msxml-document?./_msxmlDocument",
	"./_syncXmlRequest",
	"gjax/_base/kernel",
	"dojo/_base/lang",
	"gjax/uri/Uri",
	"dojox/lang/functional",
	"dojox/lang/functional/fold"
], function(Xml, has, _msxmlDocument, xmlRequest, gkernel, lang, Uri, df) {
	Xml.NAMESPACE_XSD = "http://www.w3.org/2001/XMLSchema";
	Xml.NAMESPACE_XSI = "http://www.w3.org/2001/XMLSchema-instance";
	Xml.NAMESPACE_XSL = "http://www.w3.org/1999/XSL/Transform";
	function asrtNodeType(node, type, orNull) {
		gkernel.asrt(orNull || node != null && node.nodeType == type, "Illegal node type, expecting:" + type);
	}
	//NOT PORTED METHODS:
//	evalText
//	isDocumentElement
//	isClone
//	isCloneChild
//	getLastAncestor
//	replaceNode
//	newClone
//	copyNodes2
//
//	sugar
	Xml.load = function(strUrl) {
		var e;
		if (has("dom-parser")) {
			var http = xmlRequest(strUrl);
			Xml.setSelectionNamespaces(http.responseXML);
			return http.responseXML;
		} else if (has("native-msxml-document")) {
			// we have singleton instance of IXMLDocument, which can be used to load other XMLs
			// we could use XHR here again, but we have already set flags on the instance,
			// which may not be set in XHR response (preserve white spaces)
			var xmlDoc = _msxmlDocument.get();
			xmlDoc.load(Uri.resolve(null, strUrl));
			if ((e = Xml.getParserError(xmlDoc)) != null) {
				throw e;
			}
			Xml.setSelectionNamespaces(xmlDoc);
			return xmlDoc;
		} else {
			throw new Error("ActiveX variant not implemented");
//			xmlDoc = newMSXML();
//			xmlDoc.load(strUrl);
//			if ((e = Xml.getParserError(xmlDoc)) != null) {
//				throw e;
//			}
//			Xml.setSelectionNamespaces(xmlDoc);
//			return xmlDoc;
		}
	};
	Xml.loadXml = function(strXml) {
		var xmlDoc, e;
		if (has("dom-parser")) {
			xmlDoc = new DOMParser().parseFromString(strXml, "text/xml");
		} else if (has("native-msxml-document")) {
			// we have singleton instance of IXMLDocument, which can be used to load other XMLs
			// other variant is to use Object Uri & XMR, for each string
			xmlDoc = _msxmlDocument.get();
			xmlDoc.loadXML(strXml);
			if ((e = Xml.getParserError(xmlDoc)) != null) {
				throw e;
			}
			Xml.setSelectionNamespaces(xmlDoc);
			return xmlDoc;
		} else {
			throw new Error("ActiveX variant not implemented");
			// keep consistent with XmlHttpRequest or move to AX !
			/*xmlDoc = newMSXML();
			xmlDoc.loadXML(strXml);*/
		}
		Xml.setSelectionNamespaces(xmlDoc);
		return xmlDoc;
	};
	Xml.getParserError = function(xmlDoc) {
		gkernel.asrt(xmlDoc != null, "IllegalArgumentException getParserError xmlDoc cannot be null");
		var e, pe;
		if (typeof xmlDoc.parseError == "undefined") {
			var nss = {
				mozilla : "http://www.mozilla.org/newlayout/xml/parsererror.xml",
				xhtml : "http://www.w3.org/1999/xhtml"
			};
			Xml.setSelectionNamespaces(xmlDoc, nss);
			pe = Xml.evalNode(xmlDoc, "//mozilla:parsererror | //xhtml:parsererror");
			if (pe != null) {
				e = new Error();
				e.name = "ParserError";
				e.message = Xml.getText(pe);
				return e;
			}
			return null;
		} else {//MSIE
			if (xmlDoc.parseError.errorCode !== 0) {
				pe = xmlDoc.parseError;
				e = new Error();
				e.name = "ParserError";
				e.description = e.message = //TODO: verify XB
				[
					"errorCode=" + pe.errorCode,
					",filepos=" + pe.filepos,
					",line=" + pe.line,
					",linepos=" + pe.linepos,
					",reason=" + pe.reason,
					",srcText=" + pe.srcText,
					",url=" + pe.url
				].join("\r\n");
				return e;
			}
			return null;
		}
	};
	Xml.defaultNamespaces = {
		xsl : Xml.NAMESPACE_XSL,
		xsi : Xml.NAMESPACE_XSI
	};
	Xml.setSelectionNamespaces = function(xml, namespaces) {
		asrtNodeType(xml, 9);
		var nss = lang.mixin({
			t : xml.documentElement.namespaceURI
		}, Xml.defaultNamespaces, namespaces);
		if (has("dom-parser")) {
			xml["gjax.XML._resolver"] = nss;
		} else {
			var ns = "", p;
			for (p in nss) {
				ns += " xmlns:" + p + "='" + nss[p] + "' ";
			}
			xml.setProperty("SelectionLanguage", "XPath");
			xml.setProperty("SelectionNamespaces", ns);
		}
	};
	/**
	Note:	Naschval nemaju rovnake nazvy ako MS funkcie
	aby sa dalo robits earch na deprecated MS api .selectSingleNode !!!s
	**/
	Xml.evalNode = function(contextNode, xPath) {
		var n, xml = contextNode.nodeType == 9 ? contextNode : contextNode.ownerDocument;
		if (has("dom-parser")) {
			n = xml.evaluate(xPath, contextNode, function(prefix) {
				return xml["gjax.XML._resolver"][prefix];
			}, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
			return n == null ? null : n.singleNodeValue;
		} else {
			return contextNode.selectSingleNode(xPath);
		}
	};
	Xml.evalNodes = function(contextNode, xPath, ReturnArrayType) {
		///<param name="ReturnArrayType" optional="true">
		///		Array, Stack or ArrayObject. If Not specified, native Array is returned
		///</param>
		ReturnArrayType = ReturnArrayType || Array;
		// TODO: ako je to z MS vs non ms a by ref alebo by val a zmenami nad nodesetom, je zivy alebo je to copy ?
		var e, retVal, ns, xml = contextNode.nodeType == 9 ? contextNode : contextNode.ownerDocument;
		if (has("dom-parser")) {
			/*
			retval je typu XPathResult
			@see: http://www.w3.org/TR/DOM-Level-3-XPath/xpath.html
			TODO: zvazit ORDERED_NODE_SNAPSHOT_TYPE kvoli removeAll ?
			*/
			ns = xml.evaluate(xPath, contextNode, function(prefix) {
				return xml["gjax.XML._resolver"][prefix];
			}, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			retVal = new ReturnArrayType();
			if (ns != null) {
				while ((e = ns.iterateNext()) != null) {
					retVal.push(e);
				}
			}
			return retVal;
		} else {
			/**
			IXMLDOMNodeList
			IXMLDOMSelection
			http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-536297177
			**/
			ns = contextNode.selectNodes(xPath);
			retVal = new ReturnArrayType(ns.length);
			for (var i = 0; i < ns.length; i++) {
				retVal[i] = ns[i];
			}
			return retVal;
		}
	};
	//TODO: ladene zatial iba na IE7.. po pretestovani move do XML
	/*
	kopirovanie aj so zmenou namespace
	src		- node or nodeList
	dst		- node
	[bIncludeAttrs]
	[explicitNamespace] ak je uvedene pouzije sa ten namespace inak sa pouzije dst.namespaceURI
	*/
	Xml.copyNodes = function(src, dst, bIncludeAttrs, explicitNamespace) {
		///<summary>
		///		Copies src NODE or NODES under dest NODE.
		///		Original dom of src is not modified.
		///		Namespace of new nodes is deretmined from explicit namespace
		///		or dest.namespaceURI
		///</summary>
		///<param name="src" mayBeNull="false" optional="false">
		///		source NodeList "as array type" or Node
		///</param>
		///<param name="dst" mayBeNull="false" optional="false">
		///		target Node, nodes are copied (appended) as childs of this node
		///</param>
		///<param name="bIncludeAttrs" type="Boolean" optional="true">
		///		If true, copies also attributes, otherwise attributes are skipped.
		///		Applies to recursion on child nodes of src as well.
		///</param>
		///<param name="explicitNamespace" type="String" optional="true">
		///		If not specified, copied nodes will have namespaceURI from dest.namespaceURI
		///</param>
		// TODO: rewrite to nicer code !
		bIncludeAttrs = bIncludeAttrs === true ? true : false;
		var ns = (explicitNamespace == null ? dst.namespaceURI : explicitNamespace), elm, bIsList = (src.length !== undefined), //bIsList = true if src is node list otherwise src is Node
		nli = 0, aN, retVal; // iba ak je src typu node nie node List! TODO: test !
		while ((elm = bIsList ? (nli < src.length ? src[nli++] : null) : src) != null) {
			if (elm.nodeType == 1) {
				var cChlds = elm.childNodes, bHasOnlyTextChld = (cChlds.length == 1 && cChlds[0].nodeType == 3), //copy value only for lowest level elements
				n = Xml.createElementNS(dst.ownerDocument, ns, Xml.localName(elm));
				retVal = n;
				if (bHasOnlyTextChld) {
					Xml.setText(n, Xml.getText(elm));
				}
				if (bIncludeAttrs) {
					for (var i = 0; i < elm.attributes.length; i++) {
						var ae = elm.attributes.item(i);
						if (ae.nodeName == "xmlns" || ae.nodeName.indexOf("xmlns:") === 0) {
							continue;
						}
						Xml.setAttributeNS(n, ae.namespaceURI, ae.nodeName, Xml.getText(ae));
					}
				} else {
					if (Xml.isNil(elm)) {
						Xml.setNil(n, true);
					}
				}
				aN = dst.appendChild(n);
				if (cChlds.length !== 0 && !bHasOnlyTextChld) {
					Xml.copyNodes(cChlds, aN, bIncludeAttrs, explicitNamespace);
				}
			}
			if (!bIsList) {
				return retVal;
			}
		}
		return retVal;
	};
	Xml.localName = Xml.baseName = function(node) {
		///<summary>
		///		Returns the local part of the qualified name of this node.
		///		For nodes of any type other than ELEMENT_NODE and ATTRIBUTE_NODE this is always ""
		///		(XB variant of localName vs. baseName)
		///</summary>
		///<returns type="String"/>
		return (node.localName !== undefined ? node.localName : node.baseName) || null;
	};
	Xml.createElementNS = function(xmlDocument, namespaceURI, qualifiedName) {
		asrtNodeType(xmlDocument, 9);
		if (xmlDocument.createElementNS) {
			return xmlDocument.createElementNS(namespaceURI, qualifiedName);
		} else {
			return xmlDocument.createNode(1, qualifiedName, namespaceURI || "");
		}
	};
	/**
	DO NOT USE nodeTypedValue!
	DO NOT USE nodeValue
	DO NOT USE text or textContent
	**/
	Xml.getText = function(node, preserveWhitespace) {
		///<summary>XB verion of w3.textContent, returns the text content of this node AND ITS DESCENDANTS
		///whitespaces are PRESERVED only if preserveWhitespace is set to true (default is false)
		///otherwise whitespaces are collapsed and string trimed
		///Return null for: DOCUMENT_NODE, DOCUMENT_TYPE_NODE, NOTATION_NODE
		///</summary>
		///<param name="preserveWhitespace" type="Boolean">
		///whitespaces are PRESERVED only if preserveWhitespace
		///is set to true (default is false)</param>
		///<returns type="String"></returns>
		var r, nt = node.nodeType;
		if (nt == 9 || nt == 10 || nt == 12) { //fix MS returning "" for 10 and 12 and "useless badly defined" .text for 9
			return null;
		} else {
			r = node.textContent !== undefined ? node.textContent : node.text;
			if (preserveWhitespace !== true) {
				r = Xml.collapseWhitespaces(r);
			}
			gkernel.asrt(r != null, "XML.getText, unexpected null result for:" + node.nodeName);
			return r;
		}
	};
	Xml.setText = function(node, xsdValue, preserveWhitespace) {
		///<summary>if xsdValue is null produces xsi:nil node and erases content,
		///whitespaces are PRESERVED only if preserveWhitespace is set to true (default is false)
		///otherwise whitespaces are collapsed and string trimed,
		///if node is xsd:nil and not null value (including "") is specified xsi:nil is erased
		///</summary>
		///<param name="xsdValue" type="String" mayBeNull="true" optional="false"/>
		///<param name="preserveWhitespace" type="Boolean" optional="true">default false</param>
		if (xsdValue == null) {
			Xml.setNil(node, true);
		} else {
			Xml.setNil(node, false);
			if (preserveWhitespace !== true) {
				xsdValue = Xml.collapseWhitespaces(xsdValue);
			}
			if (node.textContent !== undefined) {
				node.textContent = xsdValue;
			} else {
				node.text = xsdValue; //TODO: test,fix for attrs
			}
		}
	};
	Xml.collapseWhitespaces = function(data) {
		///<summary>
		/// Version of |data| that doesn't include whitespace at the beginning
		/// and end and normalizes all whitespace to a single space.  (Normally
		/// |data| is a property of text nodes that gives the text of the node.)
		///</summary>
		//https://developer.mozilla.org/en/whitespace_in_the_dom
		data = data.replace(/[\t\n\r ]+/g, " ");
		// TODO: optimize to quick returns and minimal substring ops
		if (data.charAt(0) == " ") {
			data = data.substring(1, data.length);
		}
		if (data.charAt(data.length - 1) == " ") {
			data = data.substring(0, data.length - 1);
		}
		return data;
	};
	/*
	The Attr value as a string, or the empty string if that
	attribute does not have a specified or default value.
	*/
	Xml.setNil = function(node, bNil) {
		if (node.nodeType != 1) {
			return; // works only for Elements others are ignored silently
		}
		gkernel.asrt(typeof bNil == "boolean");
		if (bNil) {
			while (node.hasChildNodes()) {
				node.removeChild(node.firstChild);
			}
		}
		if (bNil) {
			Xml.setAttributeNS(node, Xml.NAMESPACE_XSI, "xsi:nil", "true");
		} else {
			if (node.removeAttributeNS) {
				node.removeAttributeNS(Xml.NAMESPACE_XSI, "nil");
			} else {
				node.attributes.removeQualifiedItem("nil", Xml.NAMESPACE_XSI);
			}
		}
	};
	Xml.isNil = function(node) {
		return Xml.getAttributeNS(node, Xml.NAMESPACE_XSI, "nil") === "true";
	};
	Xml.getAttributeNS = function(node, namespaceURI, localName) {
		///<summary>The Attr value as a string,
		/// or the empty string if that attribute does not have a specified or default value
		/// </summary>
		///<param name="namespaceURI" type="String">null, "" for unqualified, string for qualified, do not send undefined here !</param>
		///<returns type="String"></returns>
		// inconsistencies: http: //reference.sitepoint.com/javascript/Element/getAttributeNS
		// namespaceURI - null means no namespace, undefined means problem for != Opera
		gkernel.asrt(localName.indexOf(":") == -1 && (namespaceURI === null || typeof namespaceURI === "string"), "XML.getAttributeNS");
		var xn, r;
		if (node.getAttributeNS) {
			r = node.getAttributeNS(namespaceURI, localName);
		} else {
			xn = node.attributes.getQualifiedItem(localName, namespaceURI || "");
			if (xn != null) {
				r = xn.nodeTypedValue;
			}
		}
		if (r == null) {
			r = ""; //MSIE getQualifiedItem ->null, and fix for opera returning null
		}
		return r;
	};
	function _attrPrefixNsMap(node) {
		var r = {}, i, a;
		for (i = 0; i < node.attributes.length; i++) {
			a = node.attributes.item(i);
			if (a.prefix) {
				r[a.prefix] = a.namespaceURI || null; //w3 normalization (MS returns "")
			}
		}
		return r;
	}
	// Others:		http://ainthek.blogspot.com/2010/06/nodesetattributensnamespaceuri.html
	// testcase:	http://localhost:4438/_testcases/xQuery/02.html
	Xml.setAttributeNS = function(node, namespaceURI, qualifiedName, value) {
		///<summary>XB implementation of w3.setAttributeNS</summary>
		///<param name="namespaceURI" type="String">null, "" for unqualified, string for qualified, do not send undefined here !</param>
		///<param name="qualifiedName" type="String">prefix:localName for qualified localName for unqualified</param>
		///<param name="value" type="String">not null,Must be converted prior to this call to avoid default conversions</param>
		asrtNodeType(node, 1);
		gkernel.asrt(typeof value == "string", "value must be string");
		namespaceURI = namespaceURI || null; //w3 normalization (all accept "" as null)
		// this check must be performed prior (not in fallback, because safari produces bullshit without warning)
		var parts = qualifiedName.split(":", 2), baseName = parts.pop(), prefix = parts.pop();
		//combinations of prefix:namespaceUri
		//p:u   (check)
		//:u    (generate and check)
		//p:    (DENY by specs)
		if (prefix && !namespaceURI) {
			throw new Error("NAMESPACE_ERR");
		}
		if (namespaceURI) {
			var prefixMap = _attrPrefixNsMap(node), p = prefix || "ns", c = 0, ns = prefixMap[p];
			while (!(ns === undefined || ns === namespaceURI)) {
				p = prefix + (c++);
				ns = prefixMap[p];
			}
			prefix = p;
			qualifiedName = prefix + ":" + baseName;
		}
		if (node.setAttributeNS) {
			node.setAttributeNS(namespaceURI, qualifiedName, value);
		} else {
			var a = node.attributes.getQualifiedItem(baseName, namespaceURI || ""); //w3 -> ms (MS fails with null)
			if (!a) {
				a = node.ownerDocument.createNode(2, qualifiedName, namespaceURI || ""); //w3 -> ms (MS fails with null)
				node.attributes.setNamedItem(a);
			}
			a.text = value;
		}
	};
	Xml.getXml = function(node) {
		gkernel.asrt(node != null && Xml.instanceOf(node), "IllegalArgumentException: XML.getXml");
		if (node.xml !== undefined) {
			return node.xml;
		}
		return new XMLSerializer().serializeToString(node);
	};
	/**
	Checks if the specified object is XMLNode (document or whatever we can call XML ;-))
	**/
	Xml.instanceOf = function(object) {
		return object.nodeType != null;
	};
	Xml.escapeSimple = function(str) {
		// fastest variant on MSIE, fast enough on others
		// testcase: http://localhost:8080/gjaxXB/GL_LANG/gjaxXB/_testcases/EscapeUtilsAndCharacter/results.html
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\'/g, '&#39;');
	};
	Xml.isAllWhitespaces = function(node) { //safe varianta aj pre netextove a neelement nody
		var text = Xml.getText(node, true);
		return text == null || text.length === 0 || !(/[^\t\n\r ]/.test(text));
	};
	Xml.removeAttributeNS = function(node, namespaceURI, localName) {
		///<summary>....,If no attribute with this local name and namespace URI is found
		///this method has no effect.
		///</summary>
		gkernel.asrt(localName.indexOf(":") == -1 && (namespaceURI === null || typeof namespaceURI === "string"), "XML.getAttributeNS");
		if (node.removeAttributeNS) {
			node.removeAttributeNS(namespaceURI, localName);
		} else {
			node.attributes.removeQualifiedItem(localName, namespaceURI || "");
		}
	};
	Xml.removeNode = function(node) {
		///<summary>
		///		Better and safe removeChild, capable to remove ALSO ATTRIBUTES.
		///		For "zoombie nodes" does nothing.
		///		Returns pointer to removed node.
		///</summary>
		///<param name="node" mayBeNull="false">
		///		Fully tested for Element,Attribute,and TextNodes nodes.
		///</param>
		var ow;
		if (node.parentNode) {
			return node.parentNode.removeChild(node);
		}
		if (node.nodeType == 2 && (ow = Xml.ownerElement(node)) != null) {
			Xml.removeAttributeNS(ow, node.namespaceURI, Xml.localName(node));
			return node;
		} else {
			console.warn("#WARNING: XML.removeNode, parentNode|ownerElement is null for:" + node.nodeName);
			//gjax.Logger.writeln("#WARNING: XML.removeNode, parentNode|ownerElement is null for:" + node.nodeName);
			return node;
		}
	};
	Xml.ownerElement = function(attribute) {
		///<summary>
		///		Returns w3.ownerElement or null for attribute nodes.
		///</summary>
		///<param name="attribute" mayBeNull="false">
		///		Must be attribute (2) otherwise error.
		///</param>
		///<returns type="" mayBeNull="true"></returns>
		asrtNodeType(attribute, 2);
		var r;
		if ((r = attribute.ownerElement) === undefined) {
			try {
				r = Xml.evalNode(attribute, "parent::*");
			} catch (e) {
				//IE11 (maybe 9+) throws this error 
				//message contains line break at end, so use index of, not equal
				//TODO: better if
				if (~e.message.indexOf("A floating attribute may not be passed as the context node for an XSLT transform or an XPath query.")) {
					return null;
				}
				throw e;
			}
		}
		asrtNodeType(r, 1, true); //or null
		return r;
	};
	/**
	collection moze byt
	a) Array of Nodes
	b) result of evalNodes (MS aj w3c) !!!
	**/
	Xml.removeAll = function(collection) {
		///<summary>
		///		Removes all specified nodes of collection. No detection of descendant relaton ship si performed so
		///		so parent is removed then child from that parent is removed.
		///		Removes also attributes by calling XML.removeNode
		///</summary>
		///<param name="collection">"Array" of nodes</param>
		// MS vetva vyremovana lebo kadejake kolekcie maju removeAll, TODO: lepsi check na MS nodelist
		//		if (typeof collection.removeAll == "function") {
		//			collection.removeAll();
		//		}
		//		else {
		for (var i = 0; i < collection.length; i++) {
			Xml.removeNode(collection[i]);
		}
		//		}
	};
	Xml.evalNodeText = function(node, xPath) {
		///<summary>
		///		Vracia NULL ak
		///		a) node neexistuje
		///		b) selected node neexistuje
		///		c) getText je "",
		///		INAK vracia getText.
		///		preserveWhitespaces is FALSE
		///</summary>
		///<returns type="String" mayBeNull="true"></returns>
		if (node == null) {
			return null;
		}
		var sn = Xml.evalNode(node, xPath);
		if (sn == null) {
			return null;
		}
		var snv = Xml.getText(sn);
		if (snv.length === 0) {
			return null;
		} else {
			return snv;
		}
	};
	Xml.appendChild = function(parentNode, newNode) {
		///<summary>
		///		XB version of parentNode.appendChild(newNode). 
		///		Solving Cross-document (XD) issues (Safari, Chrome).
		///</summary>
		if (has("xml-append-child-xd")) {
			return parentNode.appendChild(newNode);
		} else {
			var impNode = parentNode.ownerDocument.importNode(newNode, true), ret = parentNode.appendChild(impNode);
			Xml.removeNode(newNode);
			return ret;
		}
	};

	Xml.nodeToObj = function(node) {
		var childNodes = Xml.evalNodes(node, "./*|./@*");
		if (!childNodes.length) {
			// string ako return
			return Xml.getText(node);
		} else {
			// obj ako return
			var obj = df.reduce(childNodes, assignValue, {});
			// pridaj _text property iba ak ma node aj childy inak sa to handluje cez
			// rekurziu a vetvu if(chs.length==0)
			//AR: commented out, until used somewhere
			/*if (childNodes.length > 0) {
			       var txt = Xml.evalNode(node, "./text()");
			       if (txt) {
			              obj["_text"] = Xml.getText(node);
			       }
			}*/
			return obj;
		}
		function assignValue(_obj, node) {
			var value = Xml.nodeToObj(node);
			var propName = node.nodeName;
			if (node.nodeType == 2) {
				_obj["@" + propName] = value;
			} else {
				// ak uz existuje sprav z toho array (ak nie je) a pridaj prvok
				_obj[propName] = _obj[propName] == null ? value : [].concat(_obj[propName], value);
			}
			return _obj;
		}
	};
	return Xml;
});
