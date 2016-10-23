#Enhanced RQL operators

This document describes existing enhanced and new RQL operations on various data sets. 

##Filtering

	eq(<property>,<value>)

Filters for objects where the specified property's value is equal to the provided value

***

	ne(<property>,<value>)

Filters for objects where the specified property's value is not equal to the provided value

***

	lt(<property>,<value>)

Filters for objects where the specified property's value is less than the provided value

***

	le(<property>,<value>)

Filters for objects where the specified property's value is less than or equal to the provided value

***

	gt(<property>,<value>)

Filters for objects where the specified property's value is greater than the provided value

***

	ge(<property>,<value>)

Filters for objects where the specified property's value is greater than or equal to the provided value

***

	in(<property>,<array-of-values>)

Filters for objects where the specified property's value is not in the provided array

***

	out(<property>,<array-of-values>)

Filters for objects where the specified property's value is an array and the array

***

	contains(<property>,<value | expression>)

Filters for objects where the specified property's value is an array and the array contains any value 
that equals the provided value or satisfies the provided expression.

***

	excludes(<property>,<value | expression>)

Filters for objects where the specified property's value is an array and the array does not contain any of value 
that equals the provided value or satisfies the provided expression.

***

	and(<query>,<query>,...)

Applies all the given queries

***

	or(<query>,<query>,...)

The union of the given queries

##Aggregating

	aggregate(<property|function>,...)

Aggregates the array, grouping by objects that are distinct for the provided properties, 
and then reduces the remaining other property values using the provided functions

***

	sum(<property?>)

Finds the sum of every value in the array or if the property argument is provided, 
returns the sum of the value of property for every object in the array

***

	mean(<property?>)

Finds the mean of every value in the array or if the property argument is provided, 
returns the mean of the value of property for every object in the array

***

	max(<property?>)

Finds the maximum of every value in the array or if the property argument is provided, 
returns the maximum of the value of property for every object in the array

***

	min(<property?>)

Finds the minimum of every value in the array or if the property argument is provided, returns the minimum of the value of property for every object in the array

***

	count()
Returns the count of the number of records in the query's result set

##Projections on array

In this document part there is 'Array of objects' test data used for examples.

***

	has(<property>,<property>,...)

	has(documents)
	has(amount,documents)
	has(nonExistingProperty)

Filter objects containing named properties. 
Return array of objects containing the whitelisted properties.

***

	hasNot(<property>,<property>,...)

	hasNot(documents)
	hasNot(amount,documents)
	hasNot(nonExistingProperty)

Filter objects not containing named properties. 
Return objects not containing the whitelisted properties.

***

	select(<property>,<property>,...)

	select() // [{},{},{},{},{}]
	select(id) // [{id:1},{id:2},...]
	select(id,name) // [{id:1,name:"name1"},...]
	select(nonExistingProperty) // [{},{},{},{},{}]
	select(id,nonExistingProperty) // [{id:1},{id:2},...]
	
Trims each object down to the set of properties defined in the arguments. 
Return array of objects with defined (only existing) properties

***

	values(<property>,<property>,...)

	values(id) // [1,2,3,4,5]
	values(id,name) // [[1,"name1"],[2,"name1"],...]
	values(nonExistingProperty) // [undefined, undefined, ...]
	values(id,nonExistingProperty) // [[1,undefined],[2,undefined],...]
	values() // returns all values for each object

Returns an array of the given properties value for each object. 
Returns array of values or array (value can be anything) or undefined

***

	aggregate(<property|function>,...)
	
	aggregate() // [{}]
	aggregate(name) // [{name:"name1"},{name:"name2"}]
	aggregate(date,name) // [{date:"2012-01-01",name:"name1"},{date:"2012-02-01",name:"name1"},...]
	aggregate(date,name,sum(amount),max(amount),min(amount)) // [{0:49.26, 1:49.26, 2:49.26, date:"2012-01-01", name:"name1"},...]

Aggregates the array, grouping by objects that are distinct for the provided properties, 
and then reduces the remaining other property values using the provided functions.

***

	limit(count,start,maxCount)

	limit() // []
	limit(1) // return array with first element
	
Returns the given range of objects from the result set. Returns array.

***

	distinct()

	// on [1,2,3,2,3] returns [1,2,3]

Returns a result set with duplicates removed. Working on primitive types only.

***

	recurse(<property?>)

	// if recurse without properies is called, recursively search in every object property (object or array)
	recurse() // [{id:1,address:{city:"Bratislava",zip:"12345"},...}, {city:"Bratislava",zip:"12345"}, ...]
	
	recurse(address) // only named properties 
	recurse(documents) // 
	
Recursively searches, looking in children of the object as objects in arrays in the given property value.
Do not really search, but append recurse() result to target data and return it.
No array presents in result, except first item (target data). All returned results from recurse() are objects.

***

	unselect(<property>,<property>,...)

	unselect() // returns unmodified target
	unselect(id) // target has not id property anymore
	unselect(id,name) // target has not id and name property anymore
	unselect(nonExistingProperty) // returns unmodified target
	
Remove from each object the set of properties defined in the arguments. Other props should not be missing. 
Returns array of objects without defined properties.

##Projections on object

In this document part there is 'Object with arrays' test data used for examples.

***

	pick(<property>,<property>,...)

	pick(name) // {"name": "name1"}
	pick(documents) // {documents: [{...},{...},{...}]}
	pick(nonExistingProperty) // {}

Trims object down to the set of properties defined in the arguments. 
Returns object with defined (only existing) properties. Similar to select().

***

	omit(<property>,<property>,...)

	omit() // returns unmodified object
	omit(id) // object has not id property anymore
	
Remove each object the set of properties defined in the arguments. 
Returns object without defined properties. Similar to unselect().

***

	values(<property>,<property>,...)

	values(name) // ["name1"]
	values(id,name) // [ [1,"name1"] ] 

Implementation of values() improved to working with object.

***

	recurse()

Works on array and object too. See 'Projections on array' part.

	recurse2(<property?>,<removeOriginals>)

	recurse2(documents,1) // picks recursively only documents, returns documents only

This enhanced version of original recurse, can remove originals data.

***

	call(<property>,<operator>,...)
	
	// returns object contains document property containing only docs with amount less than 20
	call(documents,amount<20)
	// returns object constains documents with date property only
	call(documents,select(date))

Run operators on value of object property (use on object or array).
Does not modify object structure (returns original), only property value should be modified.
			
##Projections on nested properties

###Explanations and examples

In this document part there is 'Array of objects' test data used for examples.

	select(address/city) // [{address:{city:"Bratislava"}},{address:{city:"Bratislava"}},...]
	select(id,address/city) // [{id:1,address:{city:"Bratislava"}},{id:2,address:{city:"Bratislava"}},...]
	select(address/nonExistingProperty) // [{"address":{}},{"address":{}},{"address":{}},...]
	
Does not work on array values, ex. select(documents/code). See call() below

***
	
	unselect(address/zip) // [{...,"address": {"city": "Bratislava"},...},...]
	unselect(id,address/zip) // same as above, only id missing
	unselect(name,address/zip,address/city) // [{...,"address":{},...},...]

Does not work on array values, ex. unselect(documents/code). See call() below

***

	select(id,address/city)&values() // [[1,{"city": "Bratislava"}],[2,{"city": "Bratislava"}],...]

Selecting values of nested properties from array of objects can be done by following query combination:

	select([<property>|<nested_property>]+)&values()

###Explanations and examples

In this document part there is 'Object with arrays' test data used for examples.

	pick(address/zip) // {address:{zip:"12345"}}
	pick(id,address/city) // {id:1, address:{city:"Bratislava"}}

Does not work on array values, ex. pick(documents/code). See call() below

***

	omit(address/city,address/zip) // {...,"address":{},...}

Does not work on array values, ex. omit(documents/code). See call() below

***

	// various syntax can be used
	call(documents,amount<=20,amount>=13)
	call(documents,le(amount,20),ge(amount,13))
	call(documents,(amount<=20&amount>=13))
	call(documents,(le(amount,20)&ge(amount,13)))
	call(documents,and(amount<=20,amount>=13))
	call(documents,and(le(amount,20),ge(amount,13)))

	// documents will have date only (like expand with condition)
	call(documents,select(date))

	// documents will have array of document codes as documents property (like expandid)
	call(documents,values(code))

	// complex sample
	call(documents,le(amount,20),values(code))&unwind(documents)&project(documentList)

***

	pick(id,address/city)&values() // [[1,{"city": "Bratislava"}]]

Selecting values of nested properties from object can be done by following query combination:
	
	pick([<property?><nested_property?>]+)&values()

##Test data
Array of objects

	[
		{
			id : 1,
			name : "name1",
			date : "2012-01-01",
			amount : 12.27 + 13.67 + 23.32,
			groupId : 1,
			address : { zip : "12345", city : "Bratislava" },
			documents : [
				{ code : "DOC0001", date : "2012-01-03", amount : 12.27 },
				{ code : "DOC0005", date : "2012-01-09", amount : 13.67 },
				{ code : "DOC0006", date : "2012-01-20", amount : 23.32 }
			]
		},
		{
			id : 2,
			name : "name1",
			date : "2012-02-01",
			amount : 0,
			groupId : 1,
			address : { zip : "54321", city : "Bratislava" }
		},
		{
			id : 3,
			name : "name1",
			date : "2012-02-01",
			groupId : 1,
			address : { zip : "54321", city : "Bratislava" },
			documents : [
				{ code : "DOC0002", date : "2012-01-20", amount : 123.32 },
				{ code : "DOC0003", date : "2012-01-21", amount : 196.25 },
				{ code : "DOC0004", date : "2012-01-22", amount : 982.31 }
			]
		},
		{
			id : 4,
			name : "name2",
			date : "2012-01-01",
			amount : 0,
			groupId : 2,
			address : { zip : "12345", city : "Bratislava" }
		},
		{
			id : 5,
			name : "name2",
			date : "2012-02-01",
			amount : 0,
			groupId : 2,
			address : { zip : "54321", city : "Bratislava" }
		}
	]

Object with array

	{
		id : 1,
		name : "name1",
		date : "2012-01-01",
		amount : 49.26,
		groupId : 1,
		address : { zip : "12345", city : "Bratislava" },
		documents : [
			{
				code : "DOC0001", date : "2012-01-03", amount : 12.27,
				address : { zip : "12345", city : "Bratislava" }
			},
			{
				code : "DOC0005", date : "2012-01-09", amount : 13.67,
				address : { zip : "12345", city : "Levice" }
			},
			{
				code : "DOC0006", date : "2012-01-20", amount : 23.32,
				address : { zip : "54321", city : "Bratislava" }
			}
		]
	}

##Docs

UI/app-ui/src/main/webapp/WEB-INF/views/unit-test/rql/js-array.js [UniusNg/master]

- <http://www.persvr.org/rql/>
- <https://github.com/kriszyp/perstore/>
- <http://www.sitepen.com/blog/2010/11/02/resource-query-language-a-query-language-for-the-web-nosql/>
- <http://dundalek.com/rql/>
- <http://dundalek.com/rql/draft-zyp-rql-00.html>