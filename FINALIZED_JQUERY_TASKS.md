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
|									|encode URL,						|<http://api.jquery.com/jquery.param/>								|
|									|decode URL 						|																  	|
|									|decodeURIComponent($.param())		|																	|
|									|									|																	|	
|									|									|																	|
|									|									|																	|
|String template(XSS, safe)			|									|https://www.sitepoint.com/jquery-string-template-format-function/	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|look up element					|.find(), $("id-selector") 			|https://api.jquery.com/id-selector/, https://api.jquery.com/find/	|
|									|Eg. $("#id-selector").val()		|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|for loop							|$.each(array,function(index,value){}) 	|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|error handling						|.error(funtion(jqxhr){jqxhr.responseJSON.detail});				|https://api.jquery.com/error/, 		|
|									|try{}catch (err){}finally{}		|http://www.jquerybyexample.net/2014/02/jquery-error-handling-try-catch.html|
|									|									|																	|
|									|									|																	|
|									|									|																	|
|parsing of datetypes 				|Date.parse():						|																	|
|use standard or 					|$.parseHTML(string): convert String|<https://api.jquery.com/jquery.parsehtml/>							|
|encapuslate in functions			|to to set of DOM nodes				|https://developer.mozilla.org/en-US/docs/Web/						|
|									|string.split(separator): split		|JavaScript/Reference/Global_Objects/String/split>					|
|									|String into an array				|																	|
|									|									|																	|
|									|									|																	|
|minxing object						|$.merge(arr1, arr2)				|	https://api.jquery.com/jquery.merge/						|
|									|									|																	|
|									|							|																	|
|									|									|																	|
|String template					|	.createTextNode(): replace all special characters, encode, |													|
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



