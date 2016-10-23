define([
	"require",
	"dojo/_base/lang",
	"doh",
	"gjax/XString",
	//tested libraries
	"gjax/xml/X",
	"gjax/xml/Xml"
], function(require, lang, doh, XString, X, Xml) {

	function asrtNames(X) {
		///<param name="X" type="X"/>
		var qName = "";
		qName = X.prefix() ? X.prefix() + ":" + X.localName() : X.localName();
		doh.t(X.prefix() != null);
		doh.is(qName, X.name());
		return qName;
	}
	function getAllNodes() {
		function firstChildOfType(node, type) {
			//alebo sa radsej pytat priamo na existenciu firstElementChild - to v pripade ze nema marknute, ale ma implementovane
			node = node.firstChild;
			while (node && node.nodeType != type && (node = node.nextSibling)) {
				continue;
			}
			return node;
		}
		var d = X.load(require.toUrl("./data/allNodeTypes.xml")), r = [];

		r[1] = d.documentElement();
		r[2] = d.node("root/@attribute");
		r[3] = d.documentElement().firstTextChild();
		r[4] = X(d.node("root/e1")._node.firstChild);
		r[5] = X(firstChildOfType(d.node("root/e3")._node, 5));
		r[6] = X(firstChildOfType(firstChildOfType(d._node, 10), 6));
		r[7] = X(firstChildOfType(d._node, 7));
		r[8] = X(firstChildOfType(d._node, 8));
		r[9] = d;
		r[10] = X(firstChildOfType(d._node, 10));
		var f = d._node.createDocumentFragment();
		var fNode = f.appendChild(Xml.createElementNS(d._node, "nsFragment", "fNode"));
		fNode.text = "fNode.text";
		r[11] = X(f);
		//r[12] = null; //TODO: implement
		r.length = 12;

		return r;
	}
	// other helpers
	function textContent(n) {
		return n.textContent !== undefined ? n.textContent : n.text;
	}
	function nodeValue(n) {
		return n.nodeValue;
	}
	function dump(s) {
		return XString.toDebug(s); //TODO
	}
	function join() {
		var r = [];
		for (var i = 0; i < arguments.length; i++) {
			var a = arguments[i];
			r.push(a === undefined ? "undefined" : a === null ? "null" : dump(a));
		}
		return r.join("\t");
	}

	function textContentOrText(n) {
		return n.textContent !== undefined ? n.textContent : n.text;
	}

	var testObject = {

		"X.document" : function() {
			var d = X.load(require.toUrl("./data/X.xml"));
			doh.is("", d.name());
			doh.is("", d.prefix());
			doh.is("", d.namespaceURI());
			doh.is("#document", d.nodeName());
			return Xml.escapeSimple(d.document().toString());
		},
		"X.documentElement" : function() {
			var d = X.load(require.toUrl("./data/X.xml"));
			var de = d.documentElement();
			doh.is("p1:de", de.name());
			doh.is("p1", de.prefix());
			doh.is("nsRoot", de.namespaceURI());
			doh.t(de.nodeName() == de.name());
			return Xml.escapeSimple(de.toString());
		},
		"X.getText" : function() { //TODO: what is asserting?
			var d = X.load(require.toUrl("./data/X.xml"));
			return d.getText();
		},
		"X.firstTextChild" : function() { //TODO: what is asserting?
			var n = X.load(require.toUrl("./data/X.xml")).node("//t:mixed"), txt = n.firstTextChild();
			return dump(txt.getText());
		},
		"X.firstElementChild" : function() {
			var d = X.load(require.toUrl("./data/X.xml"));
			var e = d.documentElement().firstElementChild();
			doh.is("ch1", e.name());
			doh.is("", e.prefix());
			doh.is("nsRoot", e.namespaceURI());
			doh.t(e.nodeName() == e.name());

			var nullE = e.firstElementChild();
			doh.is(null, nullE);
			return Xml.escapeSimple(e.toString());
		},
		"X.nodes" : function() {
			var d = X.load(require.toUrl("./data/X.xml"));
			return d.nodes("//* | //@*").each(function(X/*, i, arr*/) {
				asrtNames(X);
			}).toString();
		},
		"X.getAllParsableNodes (TODO: fails in Chrome)" : function() {
			var r = getAllNodes();

			var buggy = [];
			r.forEach(function(rx, i) {
				if (rx == null || rx._node.nodeType != i) {
					buggy.push(i);
				}
			});

			var r1 = r.map(function(rx, i) {
				return i + ":" + (rx == null ? "null" : rx.toString());
			});
			// TODO: MSIE vracia aj <?xml ako PI (TODO: study if buggy !)
			// Others: cannot parse 5,6
			doh.is(0, buggy.length, "Unparsable types:" + buggy.join(",") + "<br>Raw results:" + r1.join("<br>"));
			return (r1.join("<br>"));
		},

		//<?xml version="1.0" encoding="utf-8" ?>
		//<root>
		//    <empty></empty>
		//    <emptyWithEnter>
		//    </emptyWithEnter>
		//    <withWhitespaces>
		//        <a>  a  b  </a>
		//        <cd/>
		//        <a>  e  f  </a>
		//    </withWhitespaces>
		//</root>

		"text and whitespace on load" : function() {

			var emptyWithEnter = X.load(require.toUrl("./data/textAndNodeValues.xml")).node("//emptyWithEnter"), textNode = emptyWithEnter.firstTextChild(true);
			doh.isNot(null, textNode, "textNode missing"); //this fails if ms dos not have preserveWhiteSpaceon

			var txt1 = textContentOrText(emptyWithEnter._node), txt2 = textContentOrText(textNode._node);
			// binnary file is 0D 0A 20 20 20 20
			// length:5,data:10,32,32,32,32] //VS 2008 zarovnava taby v XMLku na whitespaces ?
			doh.t(txt1.length == 5 && txt1 == "\u000A    ");
			doh.t(txt1 == txt2, "textContent of node and nodes text child should be the same");
			return dump(txt1);
		},
		"text and whitespace on loadXML" : function() {

			var emptyWithEnter = X.loadXml("<root><empty></empty><emptyWithEnter>\r\n    </emptyWithEnter></root>")//
			.node("//emptyWithEnter");
			var textNode = emptyWithEnter.firstTextChild(true);
			doh.isNot(null, textNode, "textNode missing"); //this fails if ms dos not have preserveWhiteSpaceon

			var txt1 = textContentOrText(emptyWithEnter._node), txt2 = textContentOrText(textNode._node);

			doh.t(txt1.length == 5 && txt1 == "\u000A    "); //length:5,data:10,32,32,32,32]
			doh.t(txt1 == txt2, "textContent of node and nodes text child should be the same");

			return dump(txt1);
		},
		"text or textContent vs nodeValue" : function() {
			var n = X.load(require.toUrl("./data/textAndNodeValues.xml")).node("//withWhitespaces");
			return join("#childNodes" + n._node.childNodes.length, textContent(n._node), textContent(n.firstTextChild(true)._node), nodeValue(n
					.firstTextChild(true)._node), Xml.getText(n._node), Xml.getText(n._node, true));
		},
		"serialize and whitespaces" : function() {
			var d1 = X.load(require.toUrl("./data/textAndNodeValues.xml"));
			var c1 = d1.nodes("//text()").length;
			var d2 = X.loadXml(d1.getXml());
			var c2 = d2.nodes("//text()").length;

			doh.is(c1, c2, c1 + "!=" + c2);
			return c1 + "==" + c2;
		},
		"firstTextChild and whitespaces" : function() {
			var n = X.load(require.toUrl("./data/textAndNodeValues.xml")).node("//withWhitespaces");
			var firstTextChild = n.firstTextChild(true);
			var firstNonEmptyChild = n.firstTextChild();
			// TODO: asserts
			return join(textContent(firstTextChild._node), Xml.getText(firstTextChild._node), firstTextChild.getText(), firstNonEmptyChild);
		},
		"firstTextChild and vs. xPaths" : function() {
			var n = X.load(require.toUrl("./data/textAndNodeValues.xml")).node("//withWhitespaces"), $txt1 = n.firstTextChild(true), $txt2 = n.node("./text()");
			return join(Xml.getText($txt1._node), Xml.getText($txt2._node));
		},
		"XML.removeNode (TODO: fails in IE11)" : function() {
			var r = getAllNodes(), element = r[1]._node, attribute = r[2]._node;

			doh.t(element.parentNode);
			Xml.removeNode(element);
			doh.t(!element.parentNode);

			doh.t(Xml.ownerElement(attribute));
			Xml.removeNode(attribute);
			doh.t(!Xml.ownerElement(attribute));

			//TODO: other types
		},
		"XML.removeAll" : function() {
			//var r = gjax.$A(getAllNodes()).filter(function(n) { return n != null; });
			//Xml.removeAll(r);

			var d = Xml.load(require.toUrl("./data/X.xml"));
			var toRemove = Xml.evalNodes(d, "//* | //@*");
			Xml.removeAll(toRemove);
			doh.is(null, d.documentElement);

			return Xml.escapeSimple(Xml.getXml(d));
			//TODO: other types
		},
		"XS.removeAll" : function() {
			var d;
			// remove all elements and attributes
			(d = X.load(require.toUrl("./data/X.xml"))).nodes("//* | //@*").removeAll();
			doh.is(null, d.documentElement());

			// remove all text nodes
			d = X.load(require.toUrl("./data/textAndNodeValues.xml"));
			doh.isNot(0, d.nodes("//text()").length);
			d.nodes("//text()").removeAll();
			doh.is(0, d.nodes("//text()").length);
			return Xml.escapeSimple(d.toString());
		}
	};

	doh.register("gjax/xml/X", testObject);

});
