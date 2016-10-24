require(['dojo/dom',
 'dojo/dom-construct', 
 'dojo/request', 
 'dojo/_base/array',
 'dojo/json' 
 ],function(dom, domConstruct, request, array, json){
	var countries = request.get("http://api.population.io/1.0/countries", {
		handleAs: "json"
	});

	var result = countries.then(function(response){
	console.log("ORIGINAL RESULT " + response.countries[0]);
		return response;
	}, function(err){
		console.log("CANNOT GET COUNTRY LIST");
	});



	result.then(function(country){
		country.countries[0] = "Kevin Dinh";

		console.log("NEW RESULT LIST " + country.countries[0]);
	}, function(err){
		console.log("CANNOT CHANGE VALUE");
	});
});