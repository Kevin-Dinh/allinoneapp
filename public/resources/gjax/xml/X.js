define([
	"./Xml",
	"./XPathExpr",
	"gjax/_base/kernel",
	"dojo/_base/declare"
], function(Xml, XPathExpr, gkernel, declare) {

	function X(node) {
		/// <summary></summary>
		/// <field name="_node" type="Object">Node from the native browser DOM implementation (from MSXML or whatever parser the broser is using)</field>
		///	<returns type="$X" />
		if (node == null) {
			return null;
		}
		return new _X(node);
	}

	X.loadXml = function(strXml) {
		///	<returns type="$X" />
		return X(Xml.loadXml(strXml));
	};
	X.load = function(strUrl) {
		///	<returns type="$X" />
		return X(Xml.load(strUrl));
	};

	var _X = X._X = declare(null, {
		constructor : function(node) {
			this._node = node;
		},

		type : function() {
			// nemoze sa volat nodeType aby sa dal rozoznal native Node od $X wrapra
			return this._node.nodeType;
		},
		// ****************************** NAMES  ****************************** 
		// Node.nodeName, Element.tagName, Attr.name, Node.localName (baseName),Node.prefix, namespaceURI
		name : function() {
			///<summary>Returns the fullyQualified name of this node.
			///For nodes of any type other than ELEMENT_NODE and ATTRIBUTE_NODE this is always ""
			///</summary>
			///<returns type="String"/>
			var node = this._node;
			return node.nodeType == 1 || node.nodeType == 2 ? node.nodeName : "";
		},
		nodeName : function() {
			///<summary>w3 nodeName</summary>
			///<returns type="String"/>
			return this._node.nodeName;
		},
		localName : function() {
			///<summary>Returns the local part of the qualified name of this node.
			///For nodes of any type other than ELEMENT_NODE and ATTRIBUTE_NODE this is always ""
			///</summary>
			///<returns type="String"/>
			var node = this._node;
			return (node.localName !== undefined ? node.localName : node.baseName) || "";
		},
		prefix : function() {
			///<summary>Returns the prefix of  fullyQualified name name of this node.
			///For nodes of any type other than ELEMENT_NODE and ATTRIBUTE_NODE this is always ""
			///</summary>
			return this._node.prefix || "";
		},
		namespaceURI : function() {
			///<summary>The namespace URI of this node, or "" if it is unspecified
			///For nodes of any type other than ELEMENT_NODE and ATTRIBUTE_NODE this is always ""
			///</summary>
			///<returns type="String"/>
			return this._node.namespaceURI || "";
		},
		// ****************************** TEXT and VALUES  ******************************
		getText : function(preserveWhitespace) {
			///<summary>same as XML.getText, 
			/// just returns "" instead of null
			/// for nonsence nodes DOCUMENT_NODE, DOCUMENT_TYPE_NODE, NOTATION_NODE
			/// </summary>
			///<returns type="String" mayBeNull="false"></returns>
			return Xml.getText(this._node, preserveWhitespace) || ""; // re-think null vs. "" 
		},
		setText : function(text, preserveWhitespace) {
			///<summary>same as XML.setText, just returns self for chaining</summary>
			///<returns type="$X" mayBeNull="false"></returns>
			//TODO: wtf?
			Xml.setText(this._node, text, preserveWhitespace);
		},
		firstTextChild : function(preserveWhitespace) {
			///<summary>
			///		returns first "non empty" child by default
			///</summary>
			///<param name="preserveWhitespace" type="Boolean" optional="true">
			///		if not specified, empty childs are IGNORED, 
			///		if TRUE, also empty node is considered as child and 
			///		only then the behavior is consistent with ./text()[1]
			///</param>
			///<returns type="$X" mayBeNull="true"></returns>
			var node = this._node.firstChild;
			while (node) {
				if (node.nodeType == 3 && (preserveWhitespace === true || (preserveWhitespace !== true && !Xml.isAllWhitespaces(node)))) {
					return X(node);
				}
				node = node.nextSibling;
			}
			return null;
		},
		getXml : function() {
			return Xml.getXml(this._node); //TODO: investigate XB differences more
		},
		// ****************************** MANIPULATION, Attributes, Childs ****************
		setAttribute : function(qualifiedName, value, namespaceURI) {
			///<returns type="$X"/>
			Xml.setAttributeNS(this._node, namespaceURI || null, qualifiedName, value);
			return this;
		},
		getAttribute : function(localName, namespaceURI) {
			return Xml.getAttributeNS(this._node, namespaceURI || null, localName);
		},
		removeAttribute : function(localName, namespaceURI) {
			Xml.removeAttributeNS(this._node, namespaceURI || null, localName);
			return this;
		},
		createTextNode : function(/*text*/) {
//			var n = this._node;
			//TODO: musim redesignut funkcie 
			//tak aby nevracali vzdy $X lebo je to neefektive
			//alebo sa budem prilis opakovat
			//alebo zvazit stack na sposob jQuery ?
			// alebo $X($X) bude vracat ten isty objekt 
			return X(this.document().createTextNode());
		},
		remove : function() {
			Xml.removeNode(this._node);
			// TODO: return value ?
		},
		// ****************************** TRAVERSAL AND LOOKUP  ***************************
		document : function() {
			///<summary>
			///		The Document object associated with this node. 
			///		This is also the Document object used to create new nodes. 
			///		When this node is a Document it return self.
			///</summary>
			///	<returns type="$X" />
			var node = this._node;
			return X(node.nodeType == 9 ? node : node.ownerDocument);
		},
		documentElement : function() {
			///<summary>
			///		Returns documentElement of owner document of the currentNode
			/// </summary>
			///	<returns type="$X" />
			var node = this._node;
			return X((node.nodeType == 9 ? node : node.ownerDocument).documentElement);
		},
		firstElementChild : function() {
			/// <summary>first child node of that element which is of nodeType 1 or null</summary>
			///	<returns type="$X" />
			var n, node = this._node;
			if (node.firstElementChild !== undefined) {
				n = node.firstElementChild;
			} else {
				n = node.firstChild;
				while (n && n.nodeType != 1 && (n = n.nextSibling)) {
					continue;
				}
			}
			return X(n);
		},
		parent : function() {
			///<summary>
			///		Replacement for w3.parentNode, returns parent also for attributes.
			///		Returns null for Document,DocumentFragment,Entity, Notation
			///</summary>
			// http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-1060184317
			// 1,3,4,7,8,10 !=null, 2,5,6,9,11,12 == null, pokus ako toto napisat co najefektivnejsie
			// TODO:?? fix parent being "document-fragment" for zombies (treba toto robit nad XML ?, nad HTML domom ano)
			var n = this._node, t = n.nodeType;
			if (t == 1) {
				return n.parentNode;
			}
			if (t == 2) {
				return Xml.ownerElement(n);
			}
			if (t == 3 || t == 4 || t == 8 || t == 7 || t == 10) {
				return n;
			} else {
				return null; //includes fix for MS 6,12
			}
		},
		// ****************************** General XPathSelectors *****************
		node : function(xPath, xPathParams) {
			///<summary>
			///		Basic selector, returns one node or null.
			///</summary>
			///<param name="xPath" type="String" mayBeNull="false">
			///		XPath, or XPath with parameters, using $Param convension.
			///</param>
			///<param name="xPathParams" type="Object" optional="true">
			///		Object with values for XPath params, each param corespons to object property.
			///		Values can be strings or number	datatypes
			///</param>
			///	<returns type="$X" mayBeNull="true"/>
			return X(Xml.evalNode(this._node, xPathParams === undefined ? xPath : XPathExpr.compile(xPath, xPathParams)));
		},
		nodes : function(xPath, xPathParams) {
			///	<returns type="$XS" />
			return Xs(Xml.evalNodes(this._node, xPathParams === undefined ? xPath : XPathExpr.compile(xPath, xPathParams)));
		},
		//TODO: AR: not ported, what is Convert.js ?
		/*value : function(type, xPath, xPathParams) {
			// POZOR nie je fullty tested, nema test case ! ak sa bude spravat podivne dajte vediet 
			///<summary>
			///		Selector with xsd->javascript conversion.
			///		Selects single node and	returns 
			///		undefined ,		node does not exists
			///		null,			Element has xsi:nil attribute, 
			///						for Attribute nodes null should never be returned
			///		Ecma or gjax datatype based on type param
			///</summary>
			///<param name="type" type="String" mayBeNull="false" optional="false">
			///		String, Boolean,Integer,Long,Float,Double,DateTime,Date
			///</param>

			gkernel.asrt(Convert != undefined, "Missing library Convert.js, use getText");
			xPath = xPath || ".";
			var c, n = this.node(xPath, xPathParams);
			if (n == null) {
				return undefined;
			} else {
				if (n.type() == 1 && Xml.isNil(n._node)) {
					return null;
				} else {
					c = Convert[type];
					gkernel.asrt(c != null && c.fromXsd, "Cannot find converter for type:" + type);
					return c.fromXsd(n.getText());
				}
			}
		},*/
		// ****************************** DEBUG and OTHERS ************************
		toString : function() {
			var n = this._node;
			return n.nodeName + "[" + n.nodeType + "]:" + Xml.getXml(n);
		},
		toObj : function() {
			return Xml.nodeToObj(this._node);
		},
		appendChild : function(node) {
			if (node.isInstanceOf && node.isInstanceOf(_X)) {
				node = node.firstElementChild()._node;
			}
			return Xml.appendChild(this.firstElementChild()._node, node);
		}
	});

	////////////// XS

	function Xs(nodes) {
		///	<returns type="$XS" />
		return new _Xs(nodes);
	}

	Xs.loadXml = function(strXml) {
		///	<returns type="$X" />
		return X(Xml.loadXml(strXml));
	};
	Xs.load = function(strUrl) {
		///	<returns type="$X" />
		return X(Xml.load(strUrl));
	};

	var _Xs = declare(null, {
		constructor : function(nodes) {
			this.length = 0;
			Array.prototype.push.apply(this, nodes);
		},
		length : 0,
		each : function(callback, thisp) {
			/// <param name="callback" type="Function"></param>
			/// <param name="thisp" type="Object" optional="true"></param>
			///	<returns type="$XS" />
			var len = this.length >>> 0;
			if (typeof callback != "function") {
				throw new TypeError();
			}
			for (var i = 0; i < len; i++) {
				if (i in this) {
					callback.call(thisp, X(this[i]), i, this);
				}
			}
			return this;
		},
		map : function(callback, thisp) {
			/// <param name="callback" type="Function"></param>
			/// <param name="thisp" type="Object" optional="true"></param>
			///	<returns type="$XS" />
			var len = this.length >>> 0;
			if (typeof callback != "function") {
				throw new TypeError();
			}
			var result = [];
			for (var i = 0; i < len; i++) {
				if (i in this) {
					result.push(callback.call(thisp, X(this[i]), i, this));
				}
			}
			return result;
		},
		toString : function() {
			return "$XS[length:" + this.length + "]";
		},
		removeAll : function() {
			Xml.removeAll(this);
		}

	});

	return X;
});