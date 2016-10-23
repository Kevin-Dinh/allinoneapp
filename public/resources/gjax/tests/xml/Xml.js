define([
	"dojo/_base/lang",
	"doh",
	//tested libraries
	"gjax/xml/Xml"
], function(lang, doh, Xml) {

	var testObject_misc = {
		"Parent of Attribute vs. ownerElement " : function() {
			var d = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild">' //
					+ '	<p:child xmlns:p="nsChild" a="1">' //
					+ '		<x:child/>' //
					+ '	</p:child>' //
					+ '</root>');
			var a = Xml.evalNode(d, "//@a"), p = Xml.evalNode(a, "parent::*");
			return a.parentNode + "," + a.ownerElement + "," + p.nodeName;
			//alert(p.nodeName);
		},
		"Xml.copyNodes_runonly" : function() {
			var d = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild">'//
					+ '	<p:child xmlns:p="nsChild" a="1"> '//
					+ '		<x:child/>'//
					+ '	</p:child>'//
					+ '</root>');

			var dest = Xml.loadXml("<dest xmlns='nsDest'/>");
			Xml.copyNodes(Xml.evalNodes(d, "./*/*"), dest.documentElement, true);
			return Xml.escapeSimple(Xml.getXml(dest));
		},
		"Xml.copyNodes(Array,Node,true)" : function() {
			var d1 = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild">'//
					+ '	<p:child xmlns:p="nsChild" a="1"> '//
					+ '		<x:child/>'//
					+ '		<x:child/>'//
					+ '	</p:child>'//
					+ '</root>'), d2 = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild">'//
					+ '	<p:child xmlns:p="nsChild" a="1"> '//
					+ '		<x:child/>'//
					+ '	</p:child>'//
					+ '</root>');

			var src = Xml.evalNodes(d1, "/t:root/*[1]/*"), dest = Xml.evalNode(d2, "t:root");
			doh.t(Xml.evalNodes(dest, "./*").length == 1);

			Xml.copyNodes(src, dest, true);

			doh.t(Xml.evalNodes(dest, "./*").length == 3);
			doh.t(Xml.evalNode(dest, "./*[2]").namespaceURI == "nsRoot");
			doh.t(Xml.evalNode(dest, "./*[3]").namespaceURI == "nsRoot");
			return Xml.escapeSimple(Xml.getXml(d2));
		},
		"Xml.copyNodes(Node,Node,true,'explicit')" : function() {
			var d1 = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild" a1="v1" a2="v2">'//
					+ '	<p:child xmlns:p="nsChild" a="1"> '//
					+ '		<x:child/>'//
					+ '		<x:child/>'//
					+ '	</p:child>'//
					+ '</root>'),

			d2 = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild">'//
					+ '	<p:child xmlns:p="nsChild" a="1">'//
					+ '		<x:child/>'//
					+ '	</p:child>'//
					+ '</root>');

			var src = Xml.evalNode(d1, "/t:root"), dest = Xml.evalNode(d2, "/t:root");

			doh.t(Xml.evalNodes(dest, "/t:root/*").length == 1);

			Xml.copyNodes(src, dest, true, "explicit");

			var newNode = Xml.evalNode(dest, "/t:root/*[2]");

			doh.t(Xml.baseName(newNode) == "root" && newNode.namespaceURI == "explicit");

			return Xml.escapeSimple(Xml.getXml(d2));
		},

		"Xml.nodeToObj" : function() {
			var d = Xml.loadXml('<root>'//
					+ '	<a>'//
					+ '		<b>123</b>'//
					+ '		<b2>456</b2>'//
					+ '		<b2>789</b2>'//
					+ '	</a>'//
					+ '	<c/>'//
					+ '	<d> '//
					+ '		<b>444</b>'//
					+ '		555'//
					+ '	</d>'//
					+ '	<e x="111"/>'//
					+ '</root>');

			var obj = Xml.nodeToObj(d);

			doh.is("123", obj.root.a.b);
			doh.is("456", obj.root.a.b2[0]);
			doh.is("789", obj.root.a.b2[1]);
			doh.is("", obj.root.c);
			doh.is("444", obj.root.d.b);
			doh.is("111", obj.root.e["@x"]);
		}
	};

	function naiveLocalName(node) {
		return (node.localName !== undefined ? node.localName : node.baseName);
	}

	var testObject_names = {

		"Document.localName (naive) (TODO: fails in IE9+)" : function() {

			var d = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild">'//
					+ '	<p:child xmlns:p="nsChild" a="1"> '//
					+ '		<x:child/>'//
					+ '	</p:child>'//
					+ '</root>'), n = naiveLocalName(d);
			doh.is(null, n);
			return n;
		},
		"Document.Xml.localName" : function() {
			var d = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild">'//
					+ '	<p:child xmlns:p="nsChild" a="1"> '//
					+ '		<x:child/>'//
					+ '	</p:child>'//
					+ '</root>'), n = Xml.localName(d);
			doh.is(null, n);
			return n;
		}
	};

	var testObject_setAttributeNS = {
		"setAttributeNS - different namespaces mapped to same prefix" : function() {
			var d = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild">'//
					+ '<p:child xmlns:p="nsChild">'//
					+ '<x:child/>'//
					+ '</p:child>'//
					+ '</root>');
			var ch1 = Xml.evalNode(d, "//*[local-name()='child'][1]");
			// different namespaces mapped to same prefix
			Xml.setAttributeNS(ch1, "nsAttr", "x:a1", "1");
			Xml.setAttributeNS(ch1, "nsAttr2", "x:a2", "1");

			var a1 = Xml.evalNode(d, "//attribute::*[local-name()='a1']");
			var a2 = Xml.evalNode(d, "//attribute::*[local-name()='a2']");

			doh.t(a1.prefix && a1.namespaceURI == "nsAttr");
			doh.t(a2.prefix && a2.namespaceURI == "nsAttr2");
			doh.t(a1.prefix != a2.prefix);

			return a1.namespaceURI + "," + Xml.escapeSimple(Xml.getXml(d));
		},
		"setAttributeNS - no prefix for namespaced attribute" : function() {
			var d = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild">'//
					+ '<p:child xmlns:p="nsChild">'//
					+ '<x:child/>'//
					+ '</p:child>'//
					+ '</root>');
			var ch1 = Xml.evalNode(d, "//*[local-name()='child'][1]");
			// no prefix for namespaced attribute
			Xml.setAttributeNS(ch1, "nsAttr", "a1", "1");

			var a1 = Xml.evalNode(d, "//attribute::*[local-name()='a1']");
			doh.t(a1.prefix && a1.namespaceURI == "nsAttr");
			return a1.namespaceURI + "," + Xml.escapeSimple(Xml.getXml(d));
		},
		"setAttributeNS - prefix and no namespace" : function() {
			var d = Xml.loadXml("<foo/>");
			// no prefix for namespaced attribute
			try {
				Xml.setAttributeNS(d.documentElement, "", "p:a1", "1");
				doh.t(false);
			} catch (ex) {
				doh.is("NAMESPACE_ERR", ex.message);
			}
		},
		"setAttributeNS - empty and null means no namespace" : function() {
			var d = Xml.loadXml("<foo/>");
			// no prefix for namespaced attribute

			Xml.setAttributeNS(d.documentElement, "", "a1", "1");
			var a1 = Xml.evalNode(d, "//attribute::*[local-name()='a1']");
			doh.t(!a1.prefix && !a1.namespaceURI);

			Xml.setAttributeNS(d.documentElement, null, "a2", "2");
			var a2 = Xml.evalNode(d, "//attribute::*[local-name()='a2']");
			doh.t(!a2.prefix && !a2.namespaceURI);

		},
		"setAttributeNS - reuse/notreuse of already declared prefix" : function() {
			var d = Xml.loadXml('<root xmlns="nsRoot" xmlns:x="nsChild">'//
					+ '<p:child xmlns:p="nsChild" xmlns:a="nsAttr"> '//
					+ '<x:child/>'//
					+ '</p:child>'//
					+ '</root>');
			// no prefix for namespaced attribute

			var ch1 = Xml.evalNode(d, "//*[local-name()='child'][1]");
			// different namespaces mapped to same prefix
			Xml.setAttributeNS(ch1, "nsAttr", "a1", "1");
			Xml.setAttributeNS(ch1, "nsAttr", "a:a2", "1");
			Xml.setAttributeNS(ch1, "nsAttr", "x:a3", "1");

			var a1 = Xml.evalNode(d, "//attribute::*[local-name()='a1']");
			var a2 = Xml.evalNode(d, "//attribute::*[local-name()='a2']");
			var a3 = Xml.evalNode(d, "//attribute::*[local-name()='a3']");

			doh.is("ns", a1.prefix);
			doh.is("a", a2.prefix); //only exact match is reused
			doh.is("x", a3.prefix);

			return a1.namespaceURI + "," + Xml.escapeSimple(Xml.getXml(d));
		}
	};

	doh.register("gjax/xml/Xml-misc", testObject_misc);
	doh.register("gjax/xml/Xml-names", testObject_names);
	doh.register("gjax/xml/Xml-setAttributeNS", testObject_setAttributeNS);

});