// this module defines tests for gjax/rql/template
// every array element should contains testName, object and tests properties
var reqGroupError = new Error("At least one parameter is required in this optional group"), //
emptyValueError = function(name) {
	return new Error("Non empty value expected for property '" + (name || "a") + "'");
}, //
missingValueError = function(name) {
	return new Error("Missing value for property '" + (name || "a") + "'");
}, //
missingOperationError = function(name) {
	return new Error("Operation for '" + name + "' property is not defined");
}, //
notAllowedOperationError = function(op, name) {
	return new Error("Operation '" + op + "' for '" + name + "' property is not allowed");
}, //
date = new Date(1999, 8, 10, 20, 10, 30, 0);
define([], {
	parse : [
		{
			testName : "optional operator",
			useFIQL : true,
			options : {},
			tests : {
				"{eq}(a,*)" : "a=*",
				"{eq,lt}(a,*)" : "operation(a,*,(eq,lt))"
			}
		},
		//----------------------------------------------------------------
		{
			testName : "optional group",
			options : {},
			tests : {
				// one optional groups only
				"[&sex=*?&beforeTitle=*]" : "andOpt(eq(sex,*),eq(beforeTitle,*))",
				"[&eq(sex,*)?&eq(beforeTitle,*)]" : "andOpt(eq(sex,*),eq(beforeTitle,*))",
				"[|sex=*?|beforeTitle=*]" : "or(orOpt(eq(sex,*),eq(beforeTitle,*)))",
				"[|eq(sex,*)?|eq(beforeTitle,*)]" : "or(orOpt(eq(sex,*),eq(beforeTitle,*)))",
				"[&eq(beforeTitle,*)?&eq(sex,*)]+" : "andOptPlus(eq(beforeTitle,*),eq(sex,*))",
				"[|eq(beforeTitle,*)?|eq(sex,*)]+" : "or(orOptPlus(eq(beforeTitle,*),eq(sex,*)))",
				"[|eq(arg1,*)?|eq(beforeTitle,*)]+[|eq(arg2,*)?|eq(sex,*)]+" : //
				"or(orOptPlus(eq(arg1,*),eq(beforeTitle,*)),orOptPlus(eq(arg2,*),eq(sex,*)))",
				// one group + property
				"eq(partnerType,*)[&eq(sex,*)?&eq(beforeTitle,*)]" : "eq(partnerType,*)&andOpt(eq(sex,*),eq(beforeTitle,*))",
				"eq(partnerType,*)[|eq(sex,*)?|eq(beforeTitle,*)]" : "or(eq(partnerType,*),orOpt(eq(sex,*),eq(beforeTitle,*)))",
				"eq(partnerType,*)[&eq(beforeTitle,*)?&eq(sex,*)]+" : "eq(partnerType,*)&andOptPlus(eq(beforeTitle,*),eq(sex,*))",
				"eq(partnerType,*)[|eq(beforeTitle,*)?|eq(sex,*)]+" : "or(eq(partnerType,*),orOptPlus(eq(beforeTitle,*),eq(sex,*)))",
				// more groups + property
				// at the beginning 
				"eq(partnerType,*)[|eq(arg1,*)?|eq(beforeTitle,*)]+[|eq(arg2,*)?|eq(sex,*)]+" : //
				"or(eq(partnerType,*),orOptPlus(eq(arg1,*),eq(beforeTitle,*)),orOptPlus(eq(arg2,*),eq(sex,*)))",
				"[|eq(partnerType,*)?|eq(arg1,*)?|eq(arg2,*)]+" : "or(orOptPlus(eq(partnerType,*),eq(arg1,*),eq(arg2,*)))",
				// in the middle
				"[|eq(arg1,*)?|eq(beforeTitle,*)]+|eq(partnerType,*)[|eq(arg2,*)?|eq(sex,*)]+" : //
				"or(orOptPlus(eq(arg1,*),eq(beforeTitle,*)),eq(partnerType,*),orOptPlus(eq(arg2,*),eq(sex,*)))",
				"[&eq(arg1,*)?&eq(beforeTitle,*)]+&eq(partnerType,*)[&eq(arg2,*)?&eq(sex,*)]+" : //
				"andOptPlus(eq(arg1,*),eq(beforeTitle,*))&eq(partnerType,*)&andOptPlus(eq(arg2,*),eq(sex,*))",
				// at the end
				"[|eq(arg1,*)?|eq(beforeTitle,*)]+[|eq(arg2,*)?|eq(sex,*)]+|eq(partnerType,*)" : //
				"or(orOptPlus(eq(arg1,*),eq(beforeTitle,*)),orOptPlus(eq(arg2,*),eq(sex,*)),eq(partnerType,*))",
				"[&eq(arg1,*)?&eq(beforeTitle,*)]+[&eq(arg2,*)?&eq(sex,*)]+&eq(partnerType,*)" : //
				"andOptPlus(eq(arg1,*),eq(beforeTitle,*))&andOptPlus(eq(arg2,*),eq(sex,*))&eq(partnerType,*)"
			}
		},
		//----------------------------------------------------------------
		{
			testName : "expand group template",
			options : {
				_operation : {
					name : [
						"ge",
						"le"
					]
				}
			},
			tests : {
				// expand template by operation
				"{le,ge,eq}(name,*)" : "ge(name,*)&le(name,*)" // operation for name : ["ge", "le"]
			}
		}
	],
	feed : [
		{
			testName : "optional operator",
			object : { // query + options
				a : 2,
				b : 3,
				c : 4,
				d : 5,
				x : [
					1,
					2
				],
				z : [
					10,
					[
						1,
						2
					]
				],
				z2 : [
					[
						1,
						2
					],
					10
				]
			},
			options : {
				_operation : { // predefined operations for property (first will be used otherwise) 
					b : "gt",
					c : "lt",
					x : "in",
					z : [
						"gt",
						"out"
					],
					z2 : [
						"out",
						"gt"
					]
				}
			},
			tests : {
				// named by attribute
				"operation(a,*,(eq,lt,gt))" : "a=2", // first will be used, if no one is defined
				"operation(b,*,(eq,lt,gt))" : "gt(b,3)",
				"operation(c,*,(eq,lt,gt))" : "lt(c,4)",
				"operation(c,*)" : missingOperationError("c"),
				"operation(a,*,(eq,gt))[&operation(d,*,(lt,eq))?&operation(b,*,(lt,gt))]" : "a=2&lt(d,5)&gt(b,3)",
				"a=*[&operation(d,*,(lt,eq))?&operation(b,*,(lt,gt))]" : "a=2&lt(d,5)&gt(b,3)",
				"[|operation(a,*,(eq,lt))?|operation(b,*,(eq,lt,gt))?|operation(c,*,(eq,lt,gt))]+" : "a=2|gt(b,3)|lt(c,4)",
				"a=*[&operation(f,*,(lt,eq))?&operation(e,*,(lt,gt))]+" : reqGroupError, // At least one parameter is required in this optional group
				"a=*&operation(a,*,(lt,eq))" : "a=2&lt(a,2)",
				// shorter syntax
				"{eq,lt,gt}(a,*)" : "a=2",
				"{eq,lt,gt}(b,*)" : "gt(b,3)",
				"{eq,lt,gt}(c,*)" : "lt(c,4)",
				"{eq,lt,gt}(a,*)&{eq,lt,gt}(b,*)&{eq,lt,gt}(c,*)" : "a=2&gt(b,3)&lt(c,4)",
				"{eq,gt}(a,*)[&{lt,eq}(d,*)?&{lt,gt}(b,*)]" : "a=2&lt(d,5)&gt(b,3)",
				"a=*[&{lt,eq}(d,*)?&{lt,gt}(b,*)]" : "a=2&lt(d,5)&gt(b,3)",
				"[|{eq,lt}(a,*)?|{eq,lt,gt}(b,*)?|{eq,lt,gt}(c,*)]+" : "a=2|gt(b,3)|lt(c,4)",
				"a=*[&{lt,eq}(f,*)?&{lt,gt}(e,*)]+" : reqGroupError, // At least one parameter is required in this optional group
				"a=*&{lt,eq}(a,*)" : "a=2&lt(a,2)",
				"{eq,in}(x,*)&eq(a,*)" : "in(x,(1,2))&a=2",
				"{gt,out}(z,*)" : "gt(z,10)&out(z,(1,2))",
				"{gt,out}(z2,*)" : "out(z2,(1,2))&gt(z2,10)"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "basic",
			object : {
				partnerTypes : [
					"P",
					"I"
				],
				partnerType : "P",
				sex : "M",
				beforeTitle : 12,
				changed : [
					new Date(1999, 3, 4),
					new Date(1999, 3, 9)
				],
				type : [
					3,
					5
				],
				id : [
					1,
					32,
					[
						37,
						38,
						39
					]
				]
			},
			tests : {
				"sex=*" : "sex=M",
				"eq(partnerType,*)" : "partnerType=P",
				"beforeTitle=eq=*" : "beforeTitle=12",
				"or(eq(partnerType,*),eq(beforeTitle,*))" : "partnerType=P|beforeTitle=12",
				"eq(sex,*)|eq(beforeTitle,*)" : "sex=M|beforeTitle=12",
				"in(partnerTypes,*)" : "in(partnerTypes,(P,I))",
				"out(partnerTypes,*)" : "out(partnerTypes,(P,I))",
				"ge(changed,*)&le(changed,*)" : "ge(changed,1999-04-04T00%3A00%3A00.000+02%3A00)&le(changed,1999-04-09T00%3A00%3A00.000+02%3A00)", //
				"ge(type,*)|le(type,*)" : "ge(type,3)|le(type,5)", //"type>=3|type<=5"
				"((ge(id,*)&le(id,*))|in(id,*))" : "(ge(id,1)&le(id,32))|in(id,(37,38,39))"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "select/collapse/expand/isnull/notnull",
			options : {
				isnull : [
					"id",
					"label"
				],
				notnull : [
					"id",
					"label"
				],
				expand : [
					"addresses",
					"marks"
				],
				select : [
					"partId",
					"firstName",
					"surname"
				]
			},
			tests : {
				"select(*)" : "select(partId,firstName,surname)",
				"collapse(*)" : missingValueError('collapse'),
				"expand(*)" : "expand(addresses,marks)",
				"isnull(*)&notnull(*)" : "isnull(id,label)&notnull(id,label)"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "select/collapse/expand/isnull/notnull as string",
			options : {
				isnull : "id,label",
				notnull : "id,label",
				expand : "addresses,marks",
				select : "partId,firstName,surname"
			},
			tests : {
				"select(*)" : "select(partId,firstName,surname)",
				"collapse(*)" : missingValueError('collapse'),
				"expand(*)" : "expand(addresses,marks)",
				"[&isnull(*)?&notnull(*)]" : "isnull(id,label)&notnull(id,label)"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "eq vs. like",
			object : {
				name : "X%",
				name2 : "X*",
				firstName : "ab",
				surname : "a_b",
				personalNum : "%78%"
			},
			options : {
				_operation : {
					firstName : "like",
					personalNum : "like"
				}
			},
			tests : {
				//like not allowed
				"eq(name,*)" : "name=X%25",
				"eq(firstName,*)" : "firstName=ab",
				"eq(surname,*)" : "surname=a_b",
				//like allowed
				"{eq,like}(name,*)" : "like(name,X%25)",
				"{eq,like}(name2,*)" : "like(name2,X%25)",
				"{eq,like}(firstName,*)" : "like(firstName,ab)", //predefined
				"{eq,like}(surname,*)" : "like(surname,a_b)",
				//ciLike allowed
				"{eq,ciLike}(name,*)" : "ciLike(name,X%25)",
				"{eq,ciLike}(firstName,*)" : notAllowedOperationError("like", "firstName"), //requested 'like' is not allowed
				"{eq,ciLike,like}(surname,*)" : "ciLike(surname,a_b)", //ciLike will be used, if client does not define it
				"{eq,ciLike,like}(personalNum,*)" : "like(personalNum,%2578%25)" //like will be used, defined by client
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "Null values",
			object : {
				a : null,
				b : "null",
				d : undefined
			},
			tests : {
				"eq(b,*)" : "b=string:null", //default behaviour of rql/query.encodeValue()
				"{eq,isnull}(b,*)" : "b=string:null",
				"{eq,isnull}(a,*)" : "isnull(a)",
				"{eq,isnull}(c,*)" : missingValueError('c'), //missing value error
				"eq(a,*)" : "a=string:null", // if field with null value is not optional feed it
				"[&eq(a,*)]" : "", //if field with null value is optional do not feed it and other operations is not defined
				"[&{eq,isnull}(a,*)]" : "isnull(a)", //if isnull operations is defined, feed it
				"[&{eq,isnull}(c,*)]" : "",
				"eq(d,*)" : missingValueError('d'), //missing value error
				"{eq,isnull}(d,*)" : missingValueError('d'), //missing value error
				"[&eq(d,*)]" : "",
				"[&{eq,isnull}(d,*)]" : ""
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "Nullary operators",
			options : {
				distinct : true
			},
			tests : {
				"distinct()" : "distinct()", //is resolved
				"[&distinct()]" : "distinct()",
				"first()" : "first()", //is resolved
				"[&first()]" : "",
				"[&first()]+" : reqGroupError
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "Nullary operators off",
			options : {
				distinct : null,
				first : false
			},
			tests : {
				"distinct()" : "distinct()", //is resolved
				"[&distinct()]" : "",
				"first()" : "first()", //is resolved
				"[&first()]" : "",
				"[&first()]+" : reqGroupError
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "Resolve values",
			object : {
				name : "J*",
				surname : "J%",
				firstName : "*an%",
				firstName2 : "*x*a%n*"
			},
			tests : {
				"like(name,*)" : "like(name,J%25)",
				"ciLike(surname,*)" : "ciLike(surname,J%25)",
				"ciLike(firstName,*)" : "ciLike(firstName,%25an%25)",
				"ciLike(firstName2,*)" : "ciLike(firstName2,%25x%25a%25n%25)"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "optional group",
			object : {
				partnerType : "P",
				sex : "M",
				beforeTitle : 12,
				type : [
					3,
					5
				]
			},
			tests : {
				// zero or more params in optional group
				"eq(partnerType,*)&andOpt(eq(sex,*),eq(beforeTitle,*))" : "partnerType=P&sex=M&beforeTitle=12",
				"eq(partnerType,*)[&eq(sex,*)?&eq(beforeTitle,*)]" : "partnerType=P&sex=M&beforeTitle=12",
				"eq(partnerType,*)&orOpt(eq(sex,*),eq(beforeTitle,*))" : "partnerType=P&sex=M&beforeTitle=12",
				"eq(partnerType,*)[|eq(sex,*)?|eq(beforeTitle,*)]" : "partnerType=P|sex=M|beforeTitle=12",
				// optional group should be removed
				"eq(partnerType,*)[&eq(arg1,*)?&eq(arg2,*)]" : "partnerType=P",
				"eq(partnerType,*)[|eq(arg1,*)?|eq(arg2,*)]" : "partnerType=P",
				// at least one param in optional group
				"eq(partnerType,*)[&eq(arg1,*)?&eq(arg2,*)?&eq(sex,*)]+" : "partnerType=P&sex=M",
				"eq(partnerType,*)[|eq(arg1,*)?|eq(beforeTitle,*)?|eq(arg2,*)?|eq(sex,*)]+" : "partnerType=P|beforeTitle=12|sex=M",
				"eq(partnerType,*)[|eq(arg1,*)?|eq(beforeTitle,*)]+[|eq(arg2,*)?|eq(sex,*)]+" : "partnerType=P|beforeTitle=12|sex=M",
				"[|eq(partnerType,*)?|eq(arg1,*)?|eq(arg2,*)?|ge(type,*)?|le(type,*)]+" : "partnerType=P|ge(type,3)|le(type,5)"
			}
		},
		{
			testName : "missing optional group",
			tests : {
				"[|eq(arg1,*)?|eq(arg2,*)]+" : reqGroupError,
				"[&eq(arg1,*)?&eq(arg2,*)]+" : reqGroupError
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "sort",
			object : {
				partnerType : "P",
				sex : "M",
				beforeTitle : 12
			},
			options : {
				sort : [
					{
						attribute : "sex"
					},
					{
						attribute : "partId",
						descending : true
					}
				]
			},
			tests : {
				"sort(*)" : "sort(+sex,-partId)",
				"eq(partnerType,*)&sort(*)" : "partnerType=P&sort(+sex,-partId)",
				"eq(partnerType,*)[&sort(*)]" : "partnerType=P&sort(+sex,-partId)",
				"eq(partnerType,*)[&eq(sex,*)?&sort(*)]" : "partnerType=P&sex=M&sort(+sex,-partId)",
				"[&eq(beforeTitle,*)?&eq(sex,*)]+[&eq(partnerType,*)?&sort(*)]" : "beforeTitle=12&sex=M&partnerType=P&sort(+sex,-partId)",
				"[&beforeTitle=*?&sex=*]+[&partnerType=*?&sort(*)]" : "beforeTitle=12&sex=M&partnerType=P&sort(+sex,-partId)",
				"[&eq(args1,*)?&eq(args2,*)]+[&eq(partnerType,*)?&sort(*)]" : reqGroupError,
				"[&eq(partnerType,*)?&eq(sex,*)?&sort(*)]" : "partnerType=P&sex=M&sort(+sex,-partId)"
			}
		},// ----------------------------------------------------------------
		{
			testName : "extended sort (NULLS)",
			options : {
				sort : [
					{
						attribute : "col",
						descending : true
					},
					{
						attribute : "col0",
						descending : false
					},
					{
						attribute : "col1",
						descending : true,
						nullLast : true
					},
					{
						attribute : "col2",
						descending : true,
						nullFirst : true
					},
					{
						attribute : "col3",
						descending : false,
						nullLast : true
					},
					{
						attribute : "col4",
						descending : false,
						nullFirst : true
					},
					{
						attribute : "col5",
						nullLast : true
					},
					{
						attribute : "col6",
						nullFirst : true
					}
				]
			},
			tests : {
				"sort(*)" : "sort(-col,+col0,nullLast(-col1),nullFirst(-col2),nullLast(+col3),nullFirst(+col4),nullLast(+col5),nullFirst(+col6))"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "missing sort",
			object : {
				partnerType : "P",
				sex : "M",
				beforeTitle : 12
			},
			tests : {
				"sort(*)" : missingValueError('sort'),
				"[&sort(*)]" : "",
				"eq(partnerType,*)&sort(*)" : missingValueError('sort'),
				"eq(partnerType,*)[&sort(*)]" : "partnerType=P",
				"eq(partnerType,*)[&eq(sex,*)?&sort(*)]" : "partnerType=P&sex=M",
				"[&eq(beforeTitle,*)?&eq(sex,*)]+[&eq(partnerType,*)?&sort(*)]" : "beforeTitle=12&sex=M&partnerType=P",
				"[&eq(args1,*)?&eq(args2,*)]+[&eq(partnerType,*)?&sort(*)]" : reqGroupError,
				"[&eq(partnerType,*)?&eq(sex,*)?&sort(*)]" : "partnerType=P&sex=M"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "empty sort",
			options : {
				sort : []
			},
			tests : {
				"sort(*)" : missingValueError('sort'),
				"[&sort(*)]" : ""
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "unary operator",
			object : {
				id : "idValue",
				label : "labelValue"
			},
			options : {
				resolved : true,
				id : "idCol",
				label : "labelCol"
			},
			tests : {
				"resolved(false)" : "resolved(false)",
				"resolved(*)" : "resolved(true)",
				"[&resolved(*)]" : "resolved(true)",
				"[&eq(id,*)?&eq(label,*)?&id(*)?&label(*)]" : "id=idValue&label=labelValue&id(idCol)&label(labelCol)"
			}
		},
		{
			testName : "unary operator not present",
			object : null,
			options : null,
			tests : {
				"[&resolved(*)]" : "",
				"[&eq(id,*)?&eq(label,*)?&id(*)?&label(*)]" : ""
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "prefilled operator arguments",
			object : {
				sex : "M"
			},
			options : {
				resolved : true
			},
			tests : {
				"eq(partnerType,P)" : "partnerType=P",
				"eq(partnerType,P)&sort(+sex,-partId)" : "partnerType=P&sort(+sex,-partId)",
				"sort(+sex,-partId)[&eq(sex,*)]" : "sort(+sex,-partId)&sex=M",
				"eq(partnerType,P)[&eq(sex,*)]" : "partnerType=P&sex=M",
				"[&eq(sex,*)]&eq(partnerType,P)" : "partnerType=P&sex=M",
				"id(markTypeId)&label(description)&select(col1,col2)&sort(+markTypeId,-description)&resolved(*)" : //pass throught
				"id(markTypeId)&label(description)&select(col1,col2)&sort(+markTypeId,-description)&resolved(true)"
			}
		},
		// ----------------------------------------------------------------
//		{
//			testName : "eq-extended",
//			object : {
//				city : "Br", // Brno, Bratislava
//				firstname : "Katarína"
//			},
//			tests : {
//				"[&eqex(nonExistingProp,*,(as))]" : "",
//				"eqex(firstname,*,(as))" : "eqex(firstname," + encodeURIComponent("Katarína") + ",(as))",
//				"eqex(city,*,(like))" : "eqex(city,Br,(like))",
//				"eqex(city,*,(trim))" : "eqex(city,Br,(trim))",
//				"eqex(firstname,*,(cs,ai,trim,like))" : "eqex(firstname," + encodeURIComponent("Katarína") + ",(cs,ai,trim,like))"
//			}
//		},
		// ----------------------------------------------------------------
		{
			testName : "date-formatter",
			object : {
				dateOfBirth : date,
				dateOfDeath : "2000-09-10T20:10:30.000+02:00",
				//this should not be converted to date, date type will be ignored
				stringValue : "2014",
				numberValue : 2014
			},
			tests : {
				"[&eq(nonExistingProp,*date)]" : "",
				//date object
				"eq(dateOfBirth,*)" : "dateOfBirth=1999-09-10T20%3A10%3A30.000+02%3A00",
				"eq(dateOfBirth,*date)" : "dateOfBirth=1999-09-10",
				"eq(dateOfBirth,*date-time)" : "dateOfBirth=1999-09-10T20%3A10%3A30.000+02%3A00",
				"eq(dateOfBirth,*time)" : "dateOfBirth=T20%3A10%3A30.000",
				//date as string
				"eq(dateOfDeath,*)" : "dateOfDeath=2000-09-10T20%3A10%3A30.000+02%3A00",
				"eq(dateOfDeath,*date)" : "dateOfDeath=2000-09-10",
				"eq(dateOfDeath,*date-time)" : "dateOfDeath=2000-09-10T20%3A10%3A30.000+02%3A00",
				"eq(dateOfDeath,*time)" : "dateOfDeath=T20%3A10%3A30.000",
				//this should not be converted to date, date type will be ignored
				"eq(stringValue,*)" : "stringValue=string:2014",
				"eq(stringValue,*date)" : "stringValue=string:2014",
				"eq(stringValue,*date-time)" : "stringValue=string:2014",
				"eq(stringValue,*time)" : "stringValue=string:2014",
				"eq(numberValue,*)" : "numberValue=2014",
				"eq(numberValue,*date)" : "numberValue=2014",
				"eq(numberValue,*date-time)" : "numberValue=2014",
				"eq(numberValue,*time)" : "numberValue=2014"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "non-empty-value",
			object : {
				a : "",
				b : 123,
				c : "value",
				e : null
			},
			tests : {
				"b=*" : "b=123",
				"b=+" : "b=123",
				"c=*" : "c=value",
				"c=+" : "c=value",
				"a=+" : emptyValueError(), //string value cause 'empty value' error
				"d=*" : missingValueError("d"), //undefined value cause 'missing value' error 
				"d=+" : missingValueError("d"),
				"b=+[&a=*?&c=+]" : "b=123&a=&c=value",
				"b=+[&a=+?&c=+]" : "b=123&c=value",
				"b=+[&d=*?&c=+]" : "b=123&c=value",
				"b=+[&d=+?&c=+]" : "b=123&c=value"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "missing-value",
			object : {
				b : 123
			},
			tests : {
				"b=*[&a=*]" : "b=123",
				"b=+[&a=+]" : "b=123",
				"a=*" : missingValueError(),
				"a=+" : missingValueError(),
				"sort(*)" : missingValueError('sort'),
				"b=*[&a=*?&c=*]+" : reqGroupError
			}
		},
		// ----------------------------------------------------------------
		{
			// exports.globalOperators will be moved on the end of query
			testName : "or criteria",
			object : [
				{
					sex : "M"
				},
				{
					sex : "F",
					beforeTitle : 21
				},
				{
					beforeTitle : 41
				}
			],
			options : {
				sort : [
					{
						attribute : "attr1",
						descending : true
					}
				],
				select : "partId"
			},
			tests : {
				"[&sex=*?&beforeTitle=*]" : "(sex=M|(sex=F&beforeTitle=21)|beforeTitle=41)",
				"[&sex=*?&beforeTitle=*]&sort(*)" : "(sex=M|(sex=F&beforeTitle=21)|beforeTitle=41)&sort(-attr1)",
				"[&sex=*?&beforeTitle=*]&select(*)&sort(*)" : "(sex=M|(sex=F&beforeTitle=21)|beforeTitle=41)&select(partId)&sort(-attr1)",
				"[&sex=*?&beforeTitle=*]&distinct()&select(*)" : "(sex=M|(sex=F&beforeTitle=21)|beforeTitle=41)&distinct()&select(partId)",
				"[&sex=*?&beforeTitle=*?&distinct()?&isnull(*)?&sort(*)]" : "(sex=M|(sex=F&beforeTitle=21)|beforeTitle=41)&sort(-attr1)",
				"[&sex=*?&beforeTitle=*?&distinct()?&isnull(*)]&sort(*)" : "(sex=M|(sex=F&beforeTitle=21)|beforeTitle=41)&sort(-attr1)",
				"[&sex=*?&beforeTitle=*?&select(*)?&isnull(*)?&sort(*)]" : "(sex=M|(sex=F&beforeTitle=21)|beforeTitle=41)&select(partId)&sort(-attr1)"
			}
		},
		// ----------------------------------------------------------------
		{
			// you can define your own 'global operators' by field (not operator)
			// but exports.globalOperators are still kicking too 
			testName : "or criteria with globals",
			object : [
				{
					sex : "M",
					name : "John",
					beforeTitle : 21
				},
				{
					sex : "M",
					name : "Johny",
					beforeTitle : 41
				}
			],
			options : {
				select : "test",
				_global : [
					"sex"
				]
			},
			tests : {
				"[&sex=*]" : "sex=M",
				"[&sex=*?&select(*)]" : "sex=M&select(test)",
				"[&sex=*?&beforeTitle=*]" : "(beforeTitle=21|beforeTitle=41)&sex=M",
				"[&sex=*?&beforeTitle=*?&select(*)]" : "(beforeTitle=21|beforeTitle=41)&sex=M&select(test)",
				"[&name=*?&sex=*?&beforeTitle=*]" : "((name=John&beforeTitle=21)|(name=Johny&beforeTitle=41))&sex=M"
			}
		},
		// ----------------------------------------------------------------
		{
			// you can define operation for each criteria row 
			testName : "or criteria with operations",
			object : [
				{
					a : 40
				},
				{
					a : [
						50,
						60
					]
				}
			],
			options : {
				_operation : [
					{
						a : "le"
					},
					{
						a : "in"
					}
				]
			},
			tests : {
				"{ge,le,in,out}(a,*)" : "(le(a,40)|in(a,(50,60)))"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "encoding",
			object : {
				birth : date,
				smp : "क",
				percent : "100%",
				zaba : "Žaba Ťava Vôl",
				chars : "aaa:bbb,ccc(ddd)eee",
				num : "123",
				valWithQuestion : "foo?bar",
				valWithApost : "fo'ob'ar",
				valWithParenth : "fo(ob)ar"
			},
			options : {
				sort : [
					{
						attribute : "Žaba"
					}
				]
			},
			tests : {
				"birth=*" : "birth=1999-09-10T20%3A10%3A30.000+02%3A00",
				"smp=*" : "smp=" + encodeURIComponent("क"),
				"eq(smp,*)" : "smp=" + encodeURIComponent("क"),
				"percent=*" : "percent=" + encodeURIComponent("100%"),
				"zaba=*" : "zaba=" + encodeURIComponent("Žaba Ťava Vôl"),
				"sort(*)" : "sort(+" + encodeURIComponent("Žaba") + ")",
				"lt(chars,*)" : "lt(chars,aaa%3Abbb%2Cccc%28ddd%29eee)", // comma is encoded
				"eq(num,*)" : "num=string:123", // comma is not encoded,
				"eq(valWithQuestion,*)" : "valWithQuestion=foo?bar",//if encodeQuery.encodeForQueryEngine is used: "valWithQuestion=foo%3Fbar",
				"eq(valWithApost,*)" : "valWithApost=fo'ob'ar",//if encodeQuery.encodeForQueryEngine is used: "valWithApost=fo%27ob%27ar",
				"eq(valWithParenth,*)" : "valWithParenth=fo%28ob%29ar"
			}
		},
		// ----------------------------------------------------------------
		{
			testName : "custom operators",
			object : {
				custom1 : "foo"
			},
			options : {},
			tests : {
				"custom1(*)" : "custom1(foo)"
			}
		}
	]
});