/*jshint curly:false *///ported from gjax v4, may be fixed later
define([
	"gjax/_base/kernel",
	"dojo/_base/lang",
	"./TimeZone"

], function(gkernel, lang, TimeZone) {
	
	var asrt = gkernel.asrt;
	/**
	Design Goals:
	0. XB - implementacia Date 
	1. podpora TimeZones a implementacie zo synchronizovanymi offsetmi z Java backendom
	a) nezavisla od locales klienta
	b) parsovanie z TZ-Tables je nerealne 
	stale nemame algoritmus lebo filip !! a Flegix je buggy
	nemame ani podklady v dobrom tvare navyse nevieme zabezpecit aby boli ZHODNE na servri a klientovi
	nevieme reverznut java Implementaciu ktora pouziva kompilovane tvary
	c) podkladove fajly z XDateTime 
	optimalizovane
	server side generovane (pre defaultne obdobie)
	client side (HTTP) kesovane
	server side generovane (pre out-of range obdobie)	
	client side (HTTP) kesovane + XDateTime kesovane 
	d) snaha o eleminaciu VB-scriptu 
	??? otazka ako vyriesime korektne add operacie.		

	2. NEBUDE kompatibilny z ECMA Date-om
	2a) bude zrusene vsetko nezonove API, nezmyselne konstruktory

	Non-Goals:	
	1. API - nebude nijako napodobnovat ine "standardne API" 
	(jediny kandidat co ma napada by bola Java 7, ale to je silne daleho a zvytocne zlozito)

	Links:
	http://www.merlyn.demon.co.uk/js-dates.htm

	http://js.fleegix.org/plugins/date/date
	http://poudreverte.blogspot.com/2008/10/javascript-and-timezone.html
	ECMA specification
	**/
	/**
	@author: marcus
	@testcase: 
	OLD: http://localhost:8080/gjaxbuilderwc/GL_LANG/demos/DateArithmetics/default3.asp?startYear=2000&endYear=2081&timeZone=Europe/Minsk
	NEW: http://localhost:8080/gjaxXB/GL_LANG/gjaxXB/_testcases/XDate/
	NEWEST: http://localhost:1403/_testcases/XDate/XDate.html (v Gjax.sln)

	--------------------------------------------------------------------------------------
	Features:
	Y	- yes
	N	- no
	N*	- probably NO
	*	- unknown we well see
	---------- Constructions ------------------
	Y new Date()
	Y new Date(number)
	Y new Date(year,months, date,...,TimeZone)	doplnene o TimeZone
	N Date.parse
	N Date.UTC	use new Date(year,months, date,...,GMT)
	N setTime	construct new date
	---------- Getters ------------------
	Y valueOf
	N getTime,	duplicit method, use valueOf
	N getTimezoneOffset,	use getOffset
	Y getDate,getUTCDate
	Y(?) getDay,getUTCDay - TEST and thinking needed !
	Y getFullYear,getUTCFullYear
	Y getHours,getUTCHours
	Y getMilliseconds,getUTCMilliseconds
	Y getMinutes,getUTCMinutes
	Y getMonth,getUTCMonth
	Y getSeconds,getUTCSeconds
	N getYear

	---------- Setters ------------------
	Y setDate,setUTCDate
	Y setFullYear,setUTCFullYear	//TODO: MS,FF (271821) vs. Safari(300000+) ( min and max values ! testcase + document
	Y setHours,setUTCHours
	Y setMilliseconds,setUTCMilliseconds
	Y setMinutes,setUTCMinutes
	Y setMonth,setUTCMonth
	Y setSeconds,setUTCSeconds
	N setYear

	---------- VB Conversions --------------
	*new Date(VT_DATE)
	*getVarDate
	*Date.parse(VT_DATE)
	---------- Strings	--------------
	Y toString			- vracia uf.toUTCString()
	N* toLocaleString		- modifikovany format
	N toGMTString		- modifikovany format
	N* toUTCString		- modifikovany format
	* toDateString		- modifikovany format
	* toLocaleDateString	- modifikovany format
	* toTimeString		- modifikovany format
	* toLocaleTimeString	- modifikovany format
	----------- Gjax -----------------
	//TODO:
	N fromXsd	- moved to value converters
	N toXsd		- moved to value converters
	N fromUser - moved to value converters
	N toUser		- moved to value converters	
	
	Y getOffset		
	Y setTimeZone	
	
	*clone()	 
	
	floor,
	floorUTC,
	ceil,
	ceilUTC,
	----------- Gjax deprecated--------
	*add
	* Date.newDateStrict=function(strDate)

	TODO: doiplnit zoznam a zlikvidovat

	--------------------------------------------------------------------------------------
	--------------------------------------------------------------------------------------
	Implementacia ma nasledovny prinicp

	this._lf	je Date a ma ZLE date.valueOf();
	ma v getUTC* fieldoch nastavene spravne LOKALNE hodnoty, 
	hodnoty v get* fieldoch NEPOUZIVAT
	
	this._uf	je Date a ma DOBRE date.valueOf();
	ma v getUTC* fieldoch nastavene spravne UTC hodnoty 
	hodnoty v get* fieldoch NEPOUZIVAT	
	
	a pouzivame ako lenient implementaciu na manipulaciu z kalendarom (28+1dat a podobne)

	Pravidla;
	pouzitie get* (teda bez UTC) nad this._lf,this._uf a v tomto kode zakazane, ak niekde je tak je to BUG !!!)
	vsetky this.metody bez UTC v nazve robia z lokalnym datumom a casom

	**/
	function padLeft(that, count, chr) {
		that = "" + that;
		// TODO: check chr
		if (that.length < count) {
			var retVal = that.toString();
			while (retVal.length < count) {
				retVal = chr + retVal; // TODO: optimize
			}
			return retVal;
		} else {
			return that;
		}
	}

	function _format_Z(offset, delim) {
		// terror code but minimal ifs and operations needed
		// povodne kubo, potom ja v DateFormat.js
		if (offset === 0) {
			return "+00" + delim + "00";
		}
		var x, s = "+";
		if ((x = offset / 60000) < 0) {
			x *= -1;
			s = "-";
		}
		var tmp1, tmp2;
		s += (((tmp1 = Math.floor(x / 60)) < 10) ? "0" : "") + tmp1 + delim + (((tmp2 = (x % 60)) < 10) ? "0" : "") + tmp2;
		return s;
	}

	var EcmaApi_Date = {
		valueOf : function() {
			return this._getUf().valueOf();
		},

		// FIELD getters
		getFullYear : function() {
			return this._getLf().getUTCFullYear();
		},
		getMonth : function() {
			return this._getLf().getUTCMonth();
		},
		getDate : function() {
			return this._getLf().getUTCDate();
		},
		getDay : function() {
			return this._getLf().getUTCDay();
		}, //TODO:test, study !

		getUTCFullYear : function() {
			return this._getUf().getUTCFullYear();
		},
		getUTCMonth : function() {
			return this._getUf().getUTCMonth();
		},
		getUTCDate : function() {
			return this._getUf().getUTCDate();
		},
		getUTCDay : function() {
			return this._getUf().getUTCDay();
		}, //TODO:test, study !

		// setters, getX=calcX if needed, setX=clear other+assert (asi by sa mohlo prepisat na this._setUf=null;
		setFullYear : function(v) {
			this._getLf().setUTCFullYear(v);
			this._setLf(this._lf);
		},
		setMonth : function(v) {
			this._getLf().setUTCMonth(v);
			this._setLf(this._lf);
		},
		setDate : function(v) {
			this._getLf().setUTCDate(v);
			this._setLf(this._lf);
		},

		setUTCFullYear : function(v) {
			this._getUf().setUTCFullYear(v);
			this._setUf(this._uf);
		},
		setUTCMonth : function(v) {
			this._getUf().setUTCMonth(v);
			this._setUf(this._uf);
		},
		setUTCDate : function(v) {
			this._getUf().setUTCDate(v);
			this._setUf(this._uf);
		}
	};
	var EcmaApi_Time = {
		getHours : function() {
			return this._getLf().getUTCHours();
		},
		getMinutes : function() {
			return this._getLf().getUTCMinutes();
		},
		getSeconds : function() {
			return this._getLf().getUTCSeconds();
		},
		getMilliseconds : function() {
			return this._getLf().getUTCMilliseconds();
		},

		getUTCHours : function() {
			return this._getUf().getUTCHours();
		},
		getUTCMinutes : function() {
			return this._getUf().getUTCMinutes();
		},
		getUTCSeconds : function() {
			return this._getUf().getUTCSeconds();
		},
		getUTCMilliseconds : function() {
			return this._getUf().getUTCMilliseconds();
		},

		setHours : function(/* h, m, s, ms */) {
			Date.prototype.setUTCHours.apply(this._getLf(), arguments);
			this._setLf(this._lf);
		},
		setMinutes : function(v) {
			this._getLf().setUTCMinutes(v);
			this._setLf(this._lf);
		},
		setSeconds : function(v) {
			this._getLf().setUTCSeconds(v);
			this._setLf(this._lf);
		},
		setMilliseconds : function(v) {
			this._getLf().setUTCMilliseconds(v);
			this._setLf(this._lf);
		},

		setUTCHours : function(/* h, m, s, ms */) {
			Date.prototype.setUTCHours.apply(this._getUf(), arguments);
			this._setUf(this._uf);
		},
		setUTCMinutes : function(v) {
			return this._getUf().setUTCMinutes(v);

			//TODO Is this needed?
			//this._setUf(this._uf);
		},
		setUTCSeconds : function(v) {
			return this._getUf().setUTCSeconds(v);
			//TODO Is this needed?
			//this._setUf(this._uf);
		},
		setUTCMilliseconds : function(v) {
			return this._getUf().setUTCMilliseconds(v);
			//TODO Is this needed?
			//this._setUf(this._uf);
		}
	};
	var EcmaApi_Strings = {
		//		15.9.5.3 Date.prototype.toDateString ( )
		//		This function returns a string value. The contents of the string are 
		//		implementation-dependent, but are
		//		intended to represent the date portion of the Date 
		//		in the current time zone in a 
		//		convenient, humanreadable form.
		toDateString : function() {
			var str = "";
			str = [
				this.getDate(),
				this.getMonth() + 1,
				this.getFullYear()
			].join(".");
			return str;
		},
		toTimeString : function() {
			var str = "";
			str = [
				padLeft(this.getHours(), 2, '0'),
				padLeft(this.getMinutes(), 2, '0'),
				padLeft(this.getSeconds(), 2, '0')
			].join(".") + "." + padLeft(this.getMilliseconds(), 3, 0);
			return str;
		}
	};
	var GjaxApi_Base = {
		_setUf : function(uf) {
			/** setUTCFields,clearLocalFields **/
			if (isNaN(uf)) {
				throw new Error("IllegalArgumentException isNaN(uf)");
			}
			this._uf = uf;
			this._lf = null;
		},
		_setLf : function(lf) {
			/** setLocalFields,clearUTCFields **/
			if (isNaN(lf)) {
				throw new Error("IllegalArgumentException isNaN(lf)");
			}
			this._lf = lf;
			this._uf = null;
		},
		/**
		Returns this._uf, if does not exists, builds and stores (and returns)
		**/
		_getUf : function() {
			if (this._uf == null) {
				/**
				Inicializacia datumu z Local Fields
				**/
				asrt(this._lf != null, "this._lf != null");
				asrt(this._timeZone != null, "this._timeZone != null");
				this._offset = this._timeZone.getOffsetForLocalDateTime(this._lf.getUTCFullYear(), this._lf.getUTCMonth(), this._lf.getUTCDate(), this._lf
						.getUTCHours(), this._lf.getUTCMinutes(), this._lf.getUTCSeconds());
				this._uf = new Date(this._lf.valueOf() - this._offset);
				this._assertInvariant();
			}
			return this._uf;
		},
		_getLf : function() {
			if (this._lf == null) {
				/**
				Inicializacia datumu z UTF Fields
				uf - korektny mils, v UTC fieldoch su korektne UTC udaje
				**/
				asrt(this._uf != null, "this._uf != null");
				// default zona
				this._timeZone = this._timeZone;
				// ofset na zaklade UTC
				this._offset = this._timeZone.getOffset(this._uf.getTime());
				// Local fieldy, napln UTC hodnotami a prirataj milisekundy offset-u
				this._lf = new Date(this._uf.valueOf()); //kopia lebo budem modifikovat
				this._lf.setUTCMilliseconds(this._lf.getUTCMilliseconds() + this._offset);
				// this._lf teraz obsahuje v UTC fieldoch korektny lokalny datum 
				this._assertInvariant();
			}
			return this._lf;
		},
		_assertInvariant : function() {
			try {
				asrt(this._lf != null && !isNaN(this._lf));
				asrt(this._uf != null && !isNaN(this._uf));
				asrt(this._timeZone != null);
				asrt(this._offset != null);
				asrt(this._lf.valueOf() - this._uf.valueOf() == this._offset);
			} catch (ex) {
				// TODO: dump this to log
				//debugger;
				asrt(false, "XDateTime._assertInvariant failed");
			}
		}
	};
	var GjaxApi_ZonedDateTime = {
		//gjax
		getTimeZone : function() {
			return this._timeZone;
		},
		// keeps utc and recals local (does not changes time (mills))
		setTimeZone : function(timeZone) {
			if (timeZone == null) {
				throw new Error("IllegalArgumentException timeZone cannot be null");
			}
			if (this._timeZone != null && this._timeZone.getId() == timeZone.getId()) {
				return;
			}
			// get correct URC time before switch
			this._getUf();
			// clear _lf
			this._lf = null;
			// and then set timezone
			this._timeZone = timeZone;
			// now the offset is invalid so recalc lf (which recalcs offset as well)
			this._getLf();

		},
		/**
		the amount of time in milliseconds to add to UTC to get local time
		**/
		getOffset : function() {
			if (this._offset == null)//jeden z kalendarov chyba
			{
				if (this._uf == null) {
					this._getUf();
				}
				if (this._lf == null) {
					this._getLf();
				}
			}
			asrt(this._offset != null, "GjaxApi_ZonedDateTime.getOffset this._offset cannot be null !");
			return this._offset;
		},
		getOffsetString : function() {
			return _format_Z(this.getOffset(), ":");
		}
	};
	var GjaxAPI_Time = {
		// gjax,
		// all of them modify self and return self, TODO: nanos ?
		floor : function() {
			this.setHours(0, 0, 0, 0);
			return this;
		},
		floorUTC : function() {
			this.setUTCHours(0, 0, 0, 0);
			return this;
		},
		ceil : function() {
			this.setHours(23, 59, 59, 999);
			return this;
		},
		ceilUTC : function() {
			this.setUTCHours(23, 59, 59, 999);
			return this;
		},

		// conversion XDateTime,XDate
		toDate : function() {
			return new XDate(this.getFullYear(), this.getMonth(), this.getDate(), this.getTimeZone());
		}
	};
	/**
	**/
	function XDateTime() {
		this._lf = null; //local fields
		this._uf = null; //UTC fields fields
		this._offset = null;
		this._timeZone = TimeZone.getDefault();

		if (arguments.length === 0) {
			this._setUf(new Date());
		} else if (arguments.length == 1 && typeof arguments[0] == 'number') {
			this._setUf(new Date(arguments[0]));
		} else if (arguments.length >= 3) {
			var args = Array.prototype.slice.apply(arguments);
			var lastArg = args.pop();
			var lf;
			if (lastArg instanceof TimeZone) //TODO: toto nie je ok ! ak zadam chybny argument a nie timezone nevsimnem si to !
			{
				this._timeZone = lastArg;
				lf = new Date(Date.UTC.apply(null, args)); //args is popped already	
			} else {
				lf = new Date(Date.UTC.apply(null, arguments));
			}
			this._setLf(lf);
		} else {
			throw new Error("Illegal argument exception");
		}
	}

	lang.mixin(XDateTime.prototype, GjaxApi_Base);
	lang.mixin(XDateTime.prototype, GjaxApi_ZonedDateTime);
	lang.mixin(XDateTime.prototype, EcmaApi_Date);
	lang.mixin(XDateTime.prototype, EcmaApi_Time);
	lang.mixin(XDateTime.prototype, GjaxAPI_Time);

	XDateTime.prototype.valueOf = EcmaApi_Date.valueOf;
	XDateTime.getOffsetString = function(offset) { //used by others
		return _format_Z(offset, ":");
	};
	// strings are just good for debug, use DateFormat or ValueConverter to format XDates
	XDateTime.prototype.toString = function() {
		return [
			EcmaApi_Strings.toDateString.call(this),
			EcmaApi_Strings.toTimeString.call(this),
			"(" + this.getOffsetString(),
			this.getTimeZone().getId() + ")"
		].join(" ");
	};
	XDateTime.prototype.toUTCString = function() {
		return this._getUf().toUTCString();
	};
	/**
	Pozor uz nie je zdedeny z XDateTime !
	a) Y	-	new XDate(y,m,d,TimeZone);
	b) Y	-	new XDate(y,m,d);				//with default timezone
	c) N*	-	new XDate(mills);
	d) Y	-	new XDate()						//with default timezone	
	e) N*	-	new XDate(TimeZone)				//neviem co by znamenal tento zapis (pozri test case)
	**/
	//!!! konstruktor nesmie akceptovat iba 1 argument = milisekundy, kedze by sa stratila informacia o nastaveni TimeZone
	function XDate() {
		if (arguments.length === 0 || arguments.length == 3 || (arguments.length == 4 && arguments[3] instanceof TimeZone)) {
			XDateTime.apply(this, arguments);
			// floor
			Date.prototype.setUTCHours.apply(this._getLf(), [
				0,
				0,
				0,
				0
			]);
			this._setLf(this._lf);
		} else {
			throw new Error("Illegal argument exception");
		}
	}

	lang.mixin(XDate.prototype, GjaxApi_Base);
	lang.mixin(XDate.prototype, GjaxApi_ZonedDateTime);
	lang.mixin(XDate.prototype, EcmaApi_Date);

	XDate.prototype.valueOf = EcmaApi_Date.valueOf;
	XDate.prototype.toString = function() {
		return [
			EcmaApi_Strings.toDateString.call(this),
			"(" + this.getOffsetString(),
			this.getTimeZone().getId() + ")"
		].join(" ");
	};
	return XDateTime;

});
