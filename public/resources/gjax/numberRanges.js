define([], function() {
	
	// TODO: consolidate with ES6 Numbers
	// move to number/ folder
	
	// summary:
	//		Useful collection of number ranges.
	// description:
	//		See original if something not clear:
	//		https://gitlab01.hq.gratex.com/vssbackup/gjax-clk-gui/blob/master/gjax/libs/Numbers.js
	
	var Integer = {};
	Integer.MAX = 2147483647;
	Integer.MIN = -2147483648;

	var Long = {};
	//2^53, which is less then Java long 2^63, Floating Point arithmetics
	Long.MAX = 9007199254740992;
	Long.MIN = -9007199254740992;
	/*
		MAX_LONG = 9223372036854775807;//from db2 and xsd specs
		MIN_LONG =-9223372036854775808;
	*/
	var Short = {};
	Short.MAX = 32767;
	Short.MIN = -32768;

	var Decimal = {};
	Decimal.DEFAULT_TOTAL_DIGITS = 5; //default from db2 gti design
	Decimal.DEFAULT_FRACTION_DIGITS = 0; //default from db2 gti design

	/*
	javascript vypise v exponencialnom tvare cisla, ktorych exponent v kladnom
	smere presiahne 20. Napr.:
	12e19 ==> 120000000000000000000
	1e20 ==> 100000000000000000000
	12e20 ==> 1.2e+21
	a v zapornom smere presiahne 6:
	1e-7 ==> 1e-7
	1e-6 ==> 0.000001

	*/
	var Double = {};
	Double.MAX_POS = 1.797693134E+308;
	Double.MAX_NEG = -1.797693134E+308;
	Double.MIN_POS = 2.225073858E-308;
	Double.MIN_NEG = -2.225073858E-308;

	/* sparsuje zadanu hodnotu a vyhodnoti, ci spada do rozsahov pre DOUBLE.
		Ak je zadana hodnota velmi male cislo bliziace sa k nule, mensia ako MINIMUM pre DOUBLE,
		parseFloat(x) vrati '0'. Vtedy sa este overuje, ci zadana hodnota (ako string) sa zhoduje 
		s vysledkom parsovania v podobe string-u. Teda ak je naozaj zadana '0', je to vyhodnotene ako
		platna hodnota. Ak sa ale zada ina variacia hodnoty nula, napr. 0.00 alebo 0E-5 alebo 0.8E-380,
		vrati sa to ako neplatna hodnota.
		(toto uz neplati:
	    NEKONTROLUJEME to, akceptujeme to ako platnu hodnotu.)
	*/
	Double.validateRange = function(n) {
		return (n === 0 || (Double.MAX_NEG <= n && n <= Double.MIN_NEG) || (Double.MIN_POS <= n && n <= Double.MAX_POS));
	};

	// http://en.wikipedia.org/wiki/IEEE_754#Exponent_biasing
	var Float = {};

	Float.MAX_POS = 3.4028235E38;
	Float.MAX_NEG = -3.4028235E38;
	Float.MIN_POS = 1.175494351E-38;
	Float.MIN_NEG = -1.175494351E-38;

	// by purpose exported with uppercased names, not to confuse with something else
	return {
		// summary:
		//		Useful collection of number ranges.
		// description:
		//		See original if something not clear:
		//		https://gitlab01.hq.gratex.com/vssbackup/gjax-clk-gui/blob/master/gjax/libs/Numbers.js
		
		SHORT : Short,
		INTEGER : Integer,
		LONG : Long,
		//
		DECIMAL : Decimal,
		//
		FLOAT : Float,
		DOUBLE : Double
	};

});