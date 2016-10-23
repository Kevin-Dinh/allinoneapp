define([], function() {
	var compactEntities = "34,quot,38,amp,60,lt,62,gt,160,nbsp,iexcl,cent,pound,curren,yen,brvbar,sect,uml,copy,ordf,laquo,not,shy,reg,macr,deg,plusmn,sup2,sup3,acute,micro,para,middot,cedil,sup1,ordm,raquo,frac14,frac12,frac34,iquest,Agrave,Aacute,Acirc,Atilde,Auml,Aring,AElig,Ccedil,Egrave,Eacute,Ecirc,Euml,Igrave,Iacute,Icirc,Iuml,ETH,Ntilde,Ograve,Oacute,Ocirc,Otilde,Ouml,times,Oslash,Ugrave,Uacute,Ucirc,Uuml,Yacute,THORN,szlig,agrave,aacute,acirc,atilde,auml,aring,aelig,ccedil,egrave,eacute,ecirc,euml,igrave,iacute,icirc,iuml,eth,ntilde,ograve,oacute,ocirc,otilde,ouml,divide,oslash,ugrave,uacute,ucirc,uuml,yacute,thorn,yuml,338,OElig,oelig,352,Scaron,scaron,376,Yuml,402,fnof,710,circ,732,tilde,913,Alpha,Beta,Gamma,Delta,Epsilon,Zeta,Eta,Theta,Iota,Kappa,Lambda,Mu,Nu,Xi,Omicron,Pi,Rho,931,Sigma,Tau,Upsilon,Phi,Chi,Psi,Omega,945,alpha,beta,gamma,delta,epsilon,zeta,eta,theta,iota,kappa,lambda,mu,nu,xi,omicron,pi,rho,sigmaf,sigma,tau,upsilon,phi,chi,psi,omega,977,thetasym,upsih,982,piv,8194,ensp,emsp,8201,thinsp,8204,zwnj,zwj,lrm,rlm,8211,ndash,mdash,8216,lsquo,rsquo,sbquo,8220,ldquo,rdquo,bdquo,8224,dagger,Dagger,bull,8230,hellip,8240,permil,8242,prime,Prime,8249,lsaquo,rsaquo,8254,oline,8260,frasl,8364,euro,8465,image,8472,weierp,8476,real,8482,trade,8501,alefsym,8592,larr,uarr,rarr,darr,harr,8629,crarr,8656,lArr,uArr,rArr,dArr,hArr,8704,forall,8706,part,exist,8709,empty,8711,nabla,isin,notin,8715,ni,8719,prod,8721,sum,minus,8727,lowast,8730,radic,8733,prop,infin,8736,ang,8743,and,or,cap,cup,int,8756,there4,8764,sim,8773,cong,8776,asymp,8800,ne,equiv,8804,le,ge,8834,sub,sup,nsub,8838,sube,supe,8853,oplus,8855,otimes,8869,perp,8901,sdot,8968,lceil,rceil,lfloor,rfloor,9001,lang,rang,9674,loz,9824,spades,9827,clubs,9829,hearts,diams",
	names = [],
	codes = {},
	regexp = "";
	
	(function initEntities() {		
		/*jshint expr:true */
		var arr = compactEntities.split(","), re = [];
		for (var i = 0, j = 0, len = arr.length; i < len; ++i) {
			isNaN(arr[i]) || (j = parseInt(arr[i++], 10));
			re[j] = "\\u" + ("000" + j.toString(16)).slice(-4);
			codes[arr[i]] = j;
			names[j++] = arr[i];
		}
		regexp = re.join("");	  
	}());
	
	return {
		// summary:
		//		Provides names and codes af all HTML named entities. Also provides regular expression to match them. 
		// description:
		//		See http://www.w3.org/TR/html4/sgml/entities.html for complete list.
		
		// names: [const readonly] String[]
		//		Sparse array of entity names.
		names : names,
		// codes: [const readonly] Object
		//		map of entity codes.
		codes : codes,
		// regexp: [const readonly] String
		//		Entity-matching regular expression.
		regexp : regexp
	};
});
