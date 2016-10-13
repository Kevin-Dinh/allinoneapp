# Tasks and APIs

This document shell name all APIs, in ES, jsquery, angular and dojo for common tasks

| task 						|			ES		| jquery 	| angular 	| dojo 		|
|---------------------------|-------------------|--------	|---------	|------		|
| attaching event handlers 	|					|	.bind()		|			|			|	
| url building 				|					|			|			|			|
| string templating (safe, see XSS)		|					|			|			|			|
| looking up element 		|					|			|			|			|
| for,						|					|			|			|			|
| mixing object				| Object.assign 	|			|			| lang.mixin 	|
| state of page between refresh
| error handling, show errors to user ? how ?
| for loops, and operations inside ?
| security - output plane encoding (see OWASP), in short do not trust WS to probide valid data
| parsing of datetypes / use standard or encapuslate in functions
| style - top down - right to left, no pascal , not var, var, var, var, function starts with return statement ! if is replaced with ternary etc....
| symetry - consistent api usage do not mix

<!--
## state of page between refresh

### Dojo

### Angular
-->

|task                             	| jquery                            | Links/References													|
|-----------------------------------|-----------------------------------|-------------------------------------------------------------------| 
|attaching event handlers 			|	.bind("event", function())		|<https://api.jquery.com/bind/>										|
|url building						|$.param(array/plainObj/jqueryObj)  |																	|
|									|encode URL: encodeURI(url) or encodeURIComponent(param1)						|<http://api.jquery.com/jquery.param/>								|
|									|decode URL:decodeURIComponent($.param())|<https://www.sitepoint.com/jquery-decode-url-string/>																  	|
|									|		|																	|
|									|									|																	|	
|									|									|																	|
|									|									|																	|
|String template(XSS, safe)			|.createTextNode(): replace all special characters	|https://www.sitepoint.com/jquery-string-template-format-function/	| this URL is not available(<http://livedocs.dojotoolkit.org/dijit/_TemplatedMixin#the­template>)
|									|									|																	|
|									|									|																	|
|									|									|																	|
|look up element					|.find(), $("id-selector") 			|<https://api.jquery.com/id-selector/>, <https://api.jquery.com/find/>	|
|									|Eg. $("#id-selector").val()		|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|for loop							|$.each(array,function(index,value){}) 	|<http://api.jquery.com/jquery.each/>								|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|error handling						|.error(funtion(jqxhr){jqxhr.responseJSON.detail});				|<https://api.jquery.com/error/>, 		|
|									|try{}catch (err){}		|<http://www.jquerybyexample.net/2014/02/jquery-error-handling-try-catch.html>|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|parsing of datetypes 				|Date.parse():						|<https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Date/parse>|
|use standard or 					|$.parseHTML(string): convert String|<https://api.jquery.com/jquery.parsehtml/>							|
|encapuslate in functions			|to to set of DOM nodes				|<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split>						|
|									|string.split(separator): split		|					|
|									|String into an array				|																	|
|									|var obj = jQuery.parseJSON( '{ "name": "Kevin" }' );alert( obj.name === "Kevin" );	|<http://api.jquery.com/jquery.parsejson/>					|
|									|									|																	|
|minxing object						|$.merge(arr1, arr2)				|	<https://api.jquery.com/jquery.merge/>						|
|									|									|																	|
|									|							|																	|
|									|									|																	|
|security-output plane encoding	|The link provides a number of useful examples of good and bad usage| <https://www.owasp.org/index.php/DOM_based_XSS_Prevention_Cheat_Sheet>|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|



