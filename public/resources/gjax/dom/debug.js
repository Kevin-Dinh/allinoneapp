define([], function() {	
	// summary:
	//		various debug helpers for dom. Used by test and debug tools.. Do not use in production code.
	// author: pmelisko
	
	var xpath = {
		isGeneratedId : function(id) {
			// id : string
			//      id of domNode
			// return : boolean
			//      return true if given id is generated
			// if id start with gjax, dojo, dijit or dojox, id is generated
			
			if (id && id.match(/([a-zA-Z]+_+)+\d+(.*)?/i)) {
				return true;
			}
			return false;
		},

		createXPathFromPage : function(fromNode) {
			// fromNode : domNode?
			//      generate subtree of xpath from given node or html
			// return : array
			//      return array of all generated xpaths
			// create xpaths to all domNodes
			
			fromNode = fromNode || document.querySelector("html");
			var xpathsArr = [];

			(function prez(elm, path) {
				var childs = elm.children;

				if (elm.hasAttribute('id')) {
					// rewrite path, we have unique identifier
					var elmId = elm.getAttribute('id');
					if (xpath.isGeneratedId(elmId)) {
						// if generated, add id as attribute
						path = path && path !== "" ? path + "/" : path;
						path += (elm.localName.toLowerCase() + '[@id="' + elmId + '"]');
					} else {
						// start path again
						path = ('id("' + elm.getAttribute('id') + '")');
					}
				} else if (elm.hasAttribute('name')){
					path = path && path !== "" ? path + "/" : path;
					path += (elm.localName.toLowerCase() + '[@name="' + elm.getAttribute('name') + '"]');
				} else if (elm.hasAttribute('class')) {
					path = path && path !== "" ? path + "/" : path;
					path += (elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]');
				} else {
					for ( var i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
						if (sib.localName == elm.localName) {
							i++;							
						}
					}
					path = path && path !== "" ? path + "/" : path;
					path += (elm.localName.toLowerCase() + '[' + i + ']');
				}

				if (path && path !== "") {
					console.log(path);
					xpathsArr.push(path);
				}

				for ( var c = 0, l = childs.length; c < l; c++) {
					prez(childs[c], path);
				}
			}(fromNode, ""));
			// return array of xpaths, order should be the same as document.getElementsByTagName('*') 
			return xpathsArr;
		},

		createXPathFromElement : function(elm) {
			// elm : domNode
			//      create xpath for given domNode
			// return : string
			//      return xpath
			// inspired by firefox, https://code.google.com/p/fbug/source/browse/branches/firebug1.6/content/firebug/lib.js?spec=svn12950&r=8828#1332

			for ( var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode) {
				if (elm.hasAttribute('id')) {
					var elmId = elm.getAttribute('id');
					if (xpath.isGeneratedId(elmId)) {
						segs.unshift(elm.localName.toLowerCase() + '[@id="' + elmId + '"]');
					} else {
						// if not generated id, we can end
						segs.unshift('id("' + elmId + '")');
						return segs.join('/');
					}
				} else if (elm.hasAttribute('name')){
					segs.unshift(elm.localName.toLowerCase() + '[@name="' + elm.getAttribute('name') + '"]');
				} else if (elm.hasAttribute('class')) {
					segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]');
				} else {
					for ( var i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
						if (sib.localName == elm.localName) {
							i++;							
						}
					}
					segs.unshift(elm.localName.toLowerCase() + '[' + i + ']');
				}
			}
			return segs.length ? '/' + segs.join('/') : null;
		},

		getElementsByXPath : function(doc, xpath) {
			// doc : documents?
			// xpath : String
			// return : domNode
			//      return domNode which is represented by xpath string from doc/document
			// implemtation by firefox, https://code.google.com/p/fbug/source/browse/branches/firebug1.6/content/firebug/lib.js?spec=svn12950&r=8828#1332
			
			if (!xpath) {
				xpath = doc;
				doc = document;
			}

			var nodes = [];

			try {
				var result = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
				for ( var item = result.iterateNext(); item; item = result.iterateNext()) {
					nodes.push(item);					
				}
			} catch (exc) {
				// Invalid xpath expressions make their way here sometimes.  If that happens,
				// we still want to return an empty set without an exception.
			}

			return nodes;
		}
	};
	return xpath;
});
