define([
	"require",
	"doh",
	"gjax/xml/Xml",
	"gjax/xml/has",
	//tested libraries
	"gjax/xml/XsltProcessor"
], function(require, doh, Xml, has, XsltProcessor) {

	var testObject = {
		"support of XSLTProcessor" : function() {
			doh.t(window.XSLTProcessor != null || has("trident") >= 5, "XSLTProcessor supported");
//			var p, b = [];
//			for (p in window.XSLTProcessor.prototype) {
//				b.push(p);
//			}
//			return b.join(",");
		},
		"document('')" : function() {
			var xml = Xml.loadXml("<foobar/>"); //foobar
			var xsl = Xml.load(require.toUrl("./data/xslt/document_fn_empty.xslt"));
			var processor = new XsltProcessor();
			processor.importStylesheet(xsl);

			var d = processor.transformToDocument(xml);

			var n = d.documentElement;

			doh.is("xsl:stylesheet", n.nodeName, "unexpected:" + Xml.getXml(d));
			return n.nodeName;
		},
		/**
		https://bugs.webkit.org/show_bug.cgi?id=10313
		**/
		"document('local_file')" : function() {
			var xml = Xml.loadXml("<foobar/>"); //foobar
			var xsl = Xml.load(require.toUrl("./data/xslt/document_fn_local.xslt"));
			var processor = new XsltProcessor();
			processor.importStylesheet(xsl);

			var d = processor.transformToDocument(xml);
			var n = d.documentElement;

			doh.is("test01", n.nodeName, "unexpected:" + Xml.getXml(d));
			return n.nodeName;
		},
		/**
		https://bugs.webkit.org/show_bug.cgi?id=10313
		**/
		"import" : function() {
			var xml = Xml.loadXml("<foobar/>"); //foobar
			var xsl = Xml.load(require.toUrl("./data/xslt/import.xslt"));

			var processor = new XsltProcessor();
			processor.importStylesheet(xsl);

			var d = processor.transformToDocument(xml);
			var imported = d.getElementsByTagName("imported");
			doh.is(1, imported.length, "unexpected:" + Xml.getXml(d));
			return "ok";
		},
		"include" : function() {
			var xml = Xml.loadXml("<foobar/>"); //foobar
			var xsl = Xml.load(require.toUrl("./data/xslt/include.xslt"));

			var processor = new XsltProcessor();
			processor.importStylesheet(xsl);

			var d = processor.transformToDocument(xml);
			var included = d.getElementsByTagName("included");
			doh.is(1, included.length, "unexpected:" + Xml.getXml(d));
			return "ok";
		},
		"2 templates with the same name" : function() {
			var xml = Xml.loadXml("<foobar/>"); //foobar
			var xsl = Xml.load(require.toUrl("./data/xslt/duplictTemplate.xslt"));

			var processor = new XsltProcessor();
			try {
				// it is expected that at least one of these two call will fail 
				processor.importStylesheet(xsl);
				var d = processor.transformToDocument(xml);
				doh.t(false, "transform should fail, but:" + Xml.getXml(d));
			} catch (ex) {
				if (ex.name == "AssertionError") { //TODO: correct error after migrating to doh
					throw ex;
				} else {
					return "Expected failure.[" + ex.message + "]";
				}
				//return ex.message;		
			}
		}
	//TODO: http://www.w3.org/TR/xslt#result-element-stylesheet
	};

	function run(xslUrl, xmlString, xmlUrl) {

		var xml = xmlString != null ? Xml.loadXml(xmlString) : Xml.load(xmlUrl);
		var processor = new XsltProcessor();
		var xsl = processor.loadStylesheet(xslUrl);
		processor.importStylesheet(xsl);
		return processor.transformToDocument(xml);

	}

	var tc03 = {
		"fixed 01_singleInclude.xslt" : function() {
			var r = run(require.toUrl("./data/xslt/01_singleInclude.xslt"), "<fooBar/>", null);
			return Xml.getXml(r);
		},
		"fixed 02_duplicitName.xslt" : function() {
			try {
				var r = run(require.toUrl("./data/xslt/02_duplicitName.xslt"), "<fooBar/>", null);
				doh.t(false, "Unexpected success:" + Xml.getXml(r));
			} catch (ex) {
				if (ex.name == "AssertionError") {
					throw ex;
				}
				return "Expected failure:" + ex.message;
			}
		}
	};

	/*var tc04 = {
		"bug_MSIE_transform_XHRDocument_with_DOM" : function() {
			// this works
			doh.is(gjax.supports.XHR.nativeXMLHttpRequest, "Cannot be tested without native XMLHttpRequest");
			var xhr = new gjax.XHR();
			xhr.open("GET", "./xslt/test01.xml", false);
			xhr.send("");
			var xml = xhr.responseXML, xsl = Xml.load("./xslt/test01.xslt");
			var processor = new gjax.XSLTProcessor();
			processor.importStylesheet(xsl);
			var d = processor.transformToDocument(xml);
			return Xml.getXml(d);
		},
		"bug_MSIE_transform_XHRElement_with_DOM" : function() {
			//this used to fail if XML was from native XHR and XSLTProcessor from MSXML 6.0 
			//(3.0 worked always fine, 4.0 to be tested without fix !!!) 
			// asrt(gjax.supports.XHR.nativeXMLHttpRequest, "Cannot be tested without native XMLHttpRequest");

			// load with XHR
			var xhr = new gjax.XHR();
			xhr.open("GET", "xslt/test01.xml", false);
			xhr.send("");

			// load with MSXML
			var xml = xhr.responseXML;

			var xsl = Xml.load("xslt/test01.xsl");
			alert("");
			// this will be the same version as xml (6.0,3.0,4.0)
			var processor = new XsltProcessor();

			processor.importStylesheet(xsl);
			var d = processor.transformToDocument(xml.documentElement); //this fails
			return "processor._version:" + processor._version + "\r\n" + Xml.getXml(d);
		}
	};*/

	doh.register("gjax/xml/XsltProcessor", testObject);
	doh.register("gjax/xml/XsltProcessor-tc03", tc03);
	//doh.register("gjax/xml/XsltProcessor-tc04", tc04);

});
