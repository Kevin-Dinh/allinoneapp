define([], function() {
	
//	@author marcus@gratex.com
	//	Konverzna knzinica pre opravu casovych zon.
	//	JavaScript na Windows WP pred rokom 1996 neobsahuje dobre tabulky a vracia 
	//	zle Date.getTimezoneOffset a vsetky getUTC a setUTC su buggy
	//	aj po roku 1996 sa posun z CET na CEST sprava inak pri 2:XX ako Java kod !
	//	Pouzitie:
	//	TODO: document

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
	/**
	Private constructor do not use !!!
	**/
	function TimeZone(zoneId, data, data2) {
		this._zoneId = zoneId;
		this._data = data;
		this._data2 = data2;

	}
	TimeZone._instances = {
		GMT : function() { //skratena implementacia GMT zony
			var that = new TimeZone("GMT"); // nemoze byt iba kodnuta ako object literal, aby platilo GMT instanceof TimeZone !!!
			that.getOffsetForLocalDateTime = that.getOffset = that.getRawOffset = that.getDSTSavings = function() {
				return 0;
			};
			that.inDaylightTime = function() {
				return false;
			};
			return that;
		}(),
		BrowserDefaultZone : function() {
			var that = new TimeZone("BrowserDefaultZone");
			that.getOffset = function(mills) {
				return new Date(mills).getTimezoneOffset() * -60000;
			};
			that.getOffsetForLocalDateTime = function(year, month, day, hours, minutes, seconds) {
				var d = new Date(year, month, day, hours, minutes, seconds);
				d.setFullYear(year);
				return d.getTimezoneOffset() * -60000;
			};
			that.getRawOffset = that.getDSTSavings = that.inDaylightTime = function() {
				throw new Error("Not Available for BrowserDefaultZone zone");
			};
			return that;
		}()
	};
	TimeZone._data = {};
	TimeZone._data2 = {};
	TimeZone.getInstance = function(zoneId) {
		var inst = TimeZone._instances[zoneId];
		if (inst == null) {

			if (TimeZone._data[zoneId] == null || TimeZone._data2[zoneId] == null) {
				throw new Error("TimeZone,unsupported zoneId:" + zoneId);
			}
			inst = TimeZone._instances[zoneId] = new TimeZone(zoneId, TimeZone._data[zoneId], TimeZone._data2[zoneId]);
		}
		return inst;
	};
	TimeZone.getDefault = function() {
		return TimeZone._default;
	};
	TimeZone.setDefault = function(timeZone) {
		if (timeZone == null) {
			throw new Error("IllegalArgumentException timeZone cannot be null");
		}
		this._default = timeZone;
	};

	TimeZone.prototype.getId = TimeZone.prototype.toString = TimeZone.prototype.valueOf = function() {
		return this._zoneId;
	};

	TimeZone.prototype.getOffsetForLocalDateTime = function(year, month, day, hours, minutes, seconds) {
		var date = padLeft(year, 4, '0') + padLeft(month + 1, 2, '0') + padLeft(day, 2, '0') + padLeft(hours, 2, '0') + padLeft(minutes, 2, '0')
				+ padLeft(seconds, 2, '0');

		if (date == null) {
			throw new Error("Illegal argument exception expecting string:" + date);
		}

		var toSearch = date, i = 0;
		// search odzadu hore su najnovsie datumy
		for (i = this._data.length - 1; i >= 0; i--) {
			//TODO Are these variables (m, c, p) needed?
			//var m = this._data[i][0];
			//var c = this._data[i][1]; //current offset
			//var p = this._data[i][2]; // previous offset
			var locKey = this._data[i][3]; // local serialization of date
			if (toSearch >= locKey) {
				break;
			}
		}
		if (i == -1) {
			// change sign, change mils to minutes
			return this._data[0][2]; // return previous of the first
		}
		if (i == this._data.length - 1) {
			throw new Error("IllegalArgumentException,getOffsetForLocalDateTime date out of scope:" + date);
		}
		// normal return 
		return this._data[i][1];
	};
	/*
	@date Date representing correct date !!! (correct long expected !!!)
	@returns number of minutes to be compatible with Date.getTimezoneOffset
	*/
	TimeZone.prototype.getOffset = function(mills) {
		if (mills == null) {
			throw new Error("Illegal argument exception expecting millisecond number:" + mills);
		}

		var toSearch = mills, i = 0, m, c, p;
		// search odzadu hore su najnovsie datumy
		for (i = this._data.length - 1; i >= 0; i--) {
			m = this._data[i][0], c = this._data[i][1], //current offset
			p = this._data[i][2]; // previous offset
			if (toSearch >= m) {
				break;
			}
		}
		if (i == -1) {
			// change sign, change mils to minutes
			return this._data[0][2]; // return previous of the first
		}
		if (i == this._data.length - 1) {
			throw new Error("IllegalArgumentException,getOffset mills out of scope:" + mills);
		}
		// normal return 
		return this._data[i][1];
	};
	TimeZone.prototype.getDSTSavings = function() {
		return this._data2.dstSavings;
	};
	TimeZone.prototype.getRawOffset = function() {
		return this._data2.rawOffset;
	};
	TimeZone.prototype.inDaylightTime = function(mills) {
		if (mills == null) {
			throw new Error("Illegal argument exception expecting millisecond number:" + mills);
		}

		var toSearch = mills, i = 0, m;
		// search odzadu hore su najnovsie datumy
		for (i = this._data.length - 1; i >= 0; i--) {
			m = this._data[i][0];
			if (toSearch >= m) {
				break;
			}
		}
		if (i == this._data.length - 1) {
			throw new Error("IllegalArgumentException,getOffset mills out of scope:" + mills);
		}
		return i == -1 ? this._data[0][5] : this._data[i][4];
	};
	TimeZone._default = TimeZone.getInstance("BrowserDefaultZone");

	//TODO REVIEW the question is what we should return from these: (XDateTime, TimeZone, XDate)
	return TimeZone;
});