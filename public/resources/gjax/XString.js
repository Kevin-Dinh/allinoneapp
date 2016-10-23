define([], function() {
	/**
	 author:marcus@gratex.com
	 Coombined ideas from:
	 http://webreflection.blogspot.com/ (for length and value)
	 and
	 http://base2.googlecode.com/svn/doc/base2.html#/doc/!base2.JavaScript.String2
	 **/
	function XString(value) {
		this.length = value.length;
		this.toString = this.valueOf = function() {
			return value;
		};
	}

	var StringConst = String;
	XString.prototype = new StringConst();
	XString.trim = function(that) {
		return that.replace(/^\s*/, "").replace(/\s*$/, "");
	};
	// before lastIndexOf givven string
	XString.substringBefore = function(that, strToFind) {
		var i = that.lastIndexOf(strToFind);
		return i == -1 ? that : that.substring(0, i);
	};
	// after first index of (alebo afterLastIndexOf)
	XString.substringAfter = function(that, strToFind, afterLast) {
		var i;
		if (afterLast) {
			i = that.lastIndexOf(strToFind);
			return i == -1 ? that : that.substring(i + strToFind.length);
		} else {
			i = that.indexOf(strToFind);
			return i == -1 ? that : that.substring(i + strToFind.length);
		}
	};
	XString.toCharArray = function(that) {
		var retVal = [];
		for ( var i = 0; i < that.length; i++) {
			retVal.push(that.charCodeAt(i));
		}
		return retVal;
	};
	XString.toDebug = function(that) {
		if (that == null) {
			return "null";
		}
		return that + "[length:" + that.length + ",data:" + XString.toCharArray(that) + "]";
	};
	// from old gjax //TODO: review
	XString.padLeft = function(that, count, /*String?*/chr) {
		// summary:
		//		Pad a string to guarantee that it is at least `size` length by
		//		filling with the character `ch` at the start of the
		//		string
		//	that:
		//		the string to pad
		//	count:
		//		number of chars to provide padding
		//	chr:
		//		character to pad, defaults to '0' (inspired by dojo/string)
		if (!chr) {
			chr = '0';
		}

		if (that.length < count) {
			var retVal = that.toString();
			while (retVal.length < count) {
				retVal = chr + retVal;
			}
			// TODO: optimize
			return retVal;
		} else {
			return that;
		}
	};
	// from old gjax //TODO: review
	XString.padRight = function(that, count, /*String?*/chr) {
		// summary:
		//		Pad a string to guarantee that it is at least `size` length by
		//		filling with the character `ch` at the end of the
		//		string
		//	that:
		//		the string to pad
		//	count:
		//		number of chars to provide padding
		//	chr:
		//		character to pad, defaults to '0' (inspired by dojo/string)
		if (!chr) {
			chr = '0';
		}

		if (that.length < count) {
			var retVal = that.toString();
			while (retVal.length < count) {
				retVal = retVal + chr;
			}
			// TODO: optimize
			return retVal;
		}
		return that;
	};
	XString.replaceParams = function(that, params) {
		// new version by zagi ;-)
		return that.replace(/\%([0-9]+)/gm, function(a, b) {
			return params[parseInt(b, 10)];
		});
	};
	XString.endsWith = function(that, search) {
		var x = that.lastIndexOf(search);
		return x != -1 && x == (that.length - search.length);
	};
	XString.capitalize = function(that) {
		return String(that).replace(/\b[a-z]/g, function(match) {
			return match.toUpperCase();
		});
	};

	/*
	 The next code is equivalent for
	 XString.prototype.*=function(){return XString.*.apply(null,[String(this),otehr args]);}
	 XString.prototype.trim=function(){return XString.trim.apply(null,[String(this)]);}
	 */
	for ( var fnName in XString) {
		/*jshint loopfunc:true*///TODO: fix and test
		XString.prototype[fnName] = function(method) {
			return function() {
				var args = Array.prototype.slice.call(arguments);
				args.unshift(String(this));
				return method.apply(null, args);
			};
		}(XString[fnName]);
	}
	/**
	 Basic  encoding functions, zatial sa nebude pouzivat nijaky global

	 function XEncoder(target)
	 {

	 }
	 XEncoder.camelCase: function(that){
	 return that.replace(/-\D/g, function(match){
	 return match.charAt(1).toUpperCase();
	 });
	 }
	 **/
	return XString;

});